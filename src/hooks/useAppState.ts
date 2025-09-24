// Hook for managing app state within sessions
import { webSocketService } from '../lib/websocket';
import type { SessionKey } from '../lib/utils';
import { 
    createSubmitAppStateMessage,
    createECDSAMessageSigner,
    parseSubmitAppStateResponse,
    type RPCAppSessionAllocation
} from '@erc7824/nitrolite';

export interface SubmitAppStateParams {
    appSessionId: string;
    sessionData: any; // Can be reputation data, game state, etc.
    allocations?: Array<{
        participant: string;
        asset: string;
        amount: string;
    }>;
}

export interface SubmitAppStateResult {
    success: boolean;
    appSessionId?: string;
    error?: string;
}

export const submitAppState = async (
    params: SubmitAppStateParams,
    sessionKey: SessionKey
): Promise<SubmitAppStateResult> => {
    console.log('🎯 submitAppState called with params:', params);
    
    try {
        if (!sessionKey) {
            const error = 'No session key available';
            console.error('❌ submitAppState error:', error);
            return { success: false, error };
        }

        console.log('✅ Session key available, creating signer...');
        const signer = createECDSAMessageSigner(sessionKey.privateKey);
        
        const sessionData = typeof params.sessionData === 'string' 
            ? params.sessionData 
            : JSON.stringify(params.sessionData);
            
        console.log('📄 Processed session data:', {
            originalType: typeof params.sessionData,
            processedLength: sessionData.length,
            preview: sessionData.substring(0, 100) + '...'
        });

        // Default allocations if not provided (no changes)
        const allocations: RPCAppSessionAllocation[] = params.allocations?.map(alloc => ({
            participant: alloc.participant as `0x${string}`,
            asset: alloc.asset,
            amount: alloc.amount
        })) || [];
        
        console.log('💰 Processed allocations:', allocations);

        console.log('🔐 Creating signed message...');
        const signedMessage = await createSubmitAppStateMessage(signer, {
            app_session_id: params.appSessionId as `0x${string}`,
            allocations,
            session_data: sessionData,
        });
        
        console.log('✅ Signed message created, sending via WebSocket...');
        console.log('Submitting app state:', {
            sessionId: params.appSessionId,
            dataSize: sessionData.length,
            allocations: allocations.length
        });

        // Send via WebSocket and wait for response
        return new Promise((resolve) => {
            console.log('🎧 Setting up message listener for submit response...');
            
            const messageHandler = (data: any) => {
                console.log('📨 Received WebSocket message in submitAppState:', data);
                
                try {
                    const response = parseSubmitAppStateResponse(JSON.stringify(data));
                    console.log('🔍 Parsed submit response:', response);
                    
                    if (response?.params?.appSessionId) {
                        webSocketService.removeMessageListener(messageHandler);
                        console.log('✅ App state submitted successfully:', response.params.appSessionId);
                        resolve({
                            success: true,
                            appSessionId: response.params.appSessionId
                        });
                    } else {
                        console.log('⏳ Response not for this submit request, continuing to listen...');
                    }
                } catch (error) {
                    console.log('🔍 Message not a submit response, continuing to listen...', error);
                    // Not the response we're looking for, continue listening
                }
            };

            webSocketService.addMessageListener(messageHandler);
            console.log('📤 Sending signed message via WebSocket...');
            webSocketService.send(signedMessage);

            // Timeout after 30 seconds
            setTimeout(() => {
                console.log('⏰ Submit state timeout reached');
                webSocketService.removeMessageListener(messageHandler);
                resolve({ success: false, error: 'Timeout waiting for state submission' });
            }, 30000);
        });

    } catch (error) {
        console.error('Failed to submit app state:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
};