// Close app session hook using Nitrolite
import type { Address } from 'viem';
import { webSocketService } from '../lib/websocket';
import type { SessionKey } from '../lib/utils';
import { 
    createCloseAppSessionMessage,
    createECDSAMessageSigner,
    parseCloseAppSessionResponse,
    type RPCAppSessionAllocation
} from '@erc7824/nitrolite';

export interface CloseAppSessionParams {
    appSessionId: string;
    finalAllocations: Array<{
        participant: Address;
        asset: string;
        amount: string;
    }>;
}

export interface CloseAppSessionResult {
    success: boolean;
    appSessionId?: string;
    error?: string;
}

export const closeAppSession = async (
    params: CloseAppSessionParams,
    sessionKey: SessionKey
): Promise<CloseAppSessionResult> => {
    try {
        if (!sessionKey) {
            return { success: false, error: 'No session key available' };
        }

        const signer = createECDSAMessageSigner(sessionKey.privateKey);
        
        const allocations: RPCAppSessionAllocation[] = params.finalAllocations.map(alloc => ({
            participant: alloc.participant as `0x${string}`,
            asset: alloc.asset,
            amount: alloc.amount
        }));

        const signedMessage = await createCloseAppSessionMessage(signer, {
            app_session_id: params.appSessionId as `0x${string}`,
            allocations,
        });

        console.log('Closing app session:', {
            sessionId: params.appSessionId,
            finalAllocations: allocations.length
        });

        // Send via WebSocket and wait for response
        return new Promise((resolve) => {
            const messageHandler = (data: any) => {
                try {
                    const response = parseCloseAppSessionResponse(JSON.stringify(data));
                    if (response?.params?.appSessionId) {
                        webSocketService.removeMessageListener(messageHandler);
                        console.log('App session closed successfully:', response.params.appSessionId);
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
                resolve({ success: false, error: 'Timeout waiting for session closure' });
            }, 30000);
        });

    } catch (error) {
        console.error('Failed to close app session:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
};