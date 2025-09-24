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
    try {
        if (!sessionKey) {
            return { success: false, error: 'No session key available' };
        }

        const signer = createECDSAMessageSigner(sessionKey.privateKey);
        
        const sessionData = typeof params.sessionData === 'string' 
            ? params.sessionData 
            : JSON.stringify(params.sessionData);

        // Default allocations if not provided (no changes)
        const allocations: RPCAppSessionAllocation[] = params.allocations?.map(alloc => ({
            participant: alloc.participant as `0x${string}`,
            asset: alloc.asset,
            amount: alloc.amount
        })) || [];

        const signedMessage = await createSubmitAppStateMessage(signer, {
            app_session_id: params.appSessionId as `0x${string}`,
            allocations,
            session_data: sessionData,
        });

        console.log('Submitting app state:', {
            sessionId: params.appSessionId,
            dataSize: sessionData.length,
            allocations: allocations.length
        });

        // Send via WebSocket and wait for response
        return new Promise((resolve) => {
            const messageHandler = (data: any) => {
                try {
                    const response = parseSubmitAppStateResponse(JSON.stringify(data));
                    if (response?.params?.appSessionId) {
                        webSocketService.removeMessageListener(messageHandler);
                        console.log('App state submitted successfully:', response.params.appSessionId);
                        resolve({
                            success: true,
                            appSessionId: response.params.appSessionId
                        });
                    }
                } catch (error) {
                    // Not the response we're looking for, continue listening
                }
            };

            webSocketService.addMessageListener(messageHandler);
            webSocketService.send(signedMessage);

            // Timeout after 30 seconds
            setTimeout(() => {
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