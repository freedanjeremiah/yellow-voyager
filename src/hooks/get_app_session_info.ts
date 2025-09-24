// Get app session info hook using Nitrolite
import type { Address } from 'viem';
import { webSocketService } from '../lib/websocket';
import type { SessionKey } from '../lib/utils';
import { 
    NitroliteRPC,
    RPCMethod,
    createECDSAMessageSigner,
    parseGetAppSessionsResponse
} from '@erc7824/nitrolite';

export interface AppSessionInfo {
    appSessionId: string;
    participants: Address[];
    allocations: Array<{
        participant: Address;
        asset: string;
        amount: string;
    }>;
    state?: any;
    status: 'active' | 'closed';
}

export interface GetAppSessionInfoResult {
    success: boolean;
    sessions?: AppSessionInfo[];
    error?: string;
}

export const getAppSessionInfo = async (
    sessionKey: SessionKey,
    currentUser: Address,
    participant?: Address
): Promise<GetAppSessionInfoResult> => {
    try {
        if (!sessionKey) {
            return { success: false, error: 'No session key available' };
        }

        if (!currentUser) {
            return { success: false, error: 'User not authenticated' };
        }

        const targetParticipant = participant || currentUser;
        const signer = createECDSAMessageSigner(sessionKey.privateKey);
        
        const timestamp = Date.now();
        const requestId = Math.floor(Math.random() * 1000000);
        const request = NitroliteRPC.createRequest({
            requestId,
            method: RPCMethod.GetAppSessions,
            params: { participant: targetParticipant },
            timestamp,
        });
        
        const signedRequest = await NitroliteRPC.signRequestMessage(request, signer);

        console.log('Getting app sessions for participant:', targetParticipant);

        // Send via WebSocket and wait for response
        return new Promise((resolve) => {
            const messageHandler = (data: any) => {
                try {
                    const response = parseGetAppSessionsResponse(JSON.stringify(data));
                    if (response?.params?.appSessions) {
                        webSocketService.removeMessageListener(messageHandler);
                        
                        const sessions: AppSessionInfo[] = response.params.appSessions.map((session: any) => ({
                            appSessionId: session.appSessionId || session.id,
                            participants: session.participants || [],
                            allocations: session.allocations || [],
                            state: session.state,
                            status: session.status || 'active'
                        }));
                        
                        console.log('Retrieved app sessions:', sessions.length);
                        resolve({
                            success: true,
                            sessions
                        });
                    }
                } catch (error) {
                    // Not the response we're looking for, continue listening
                }
            };

            webSocketService.addMessageListener(messageHandler);
            webSocketService.send(JSON.stringify(signedRequest));

            // Timeout after 30 seconds
            setTimeout(() => {
                webSocketService.removeMessageListener(messageHandler);
                resolve({ success: false, error: 'Timeout waiting for session info' });
            }, 30000);
        });

    } catch (error) {
        console.error('Failed to get app session info:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
};