// Create app session hook using Nitrolite
import type { Address } from 'viem';
import { webSocketService } from '../lib/websocket';
import type { SessionKey } from '../lib/utils';
import { 
    createAppSessionMessage,
    createECDSAMessageSigner,
    parseCreateAppSessionResponse,
    type RPCAppDefinition,
    type RPCAppSessionAllocation
} from '@erc7824/nitrolite';

export interface CreateAppSessionParams {
    participants: Address[];
    weights?: number[];
    allocations: Array<{
        participant: Address;
        asset: string;
        amount: string;
    }>;
    protocol?: string;
    quorum?: number;
}

export interface CreateAppSessionResult {
    success: boolean;
    appSessionId?: string;
    error?: string;
}

export const createAppSession = async (
    params: CreateAppSessionParams,
    sessionKey: SessionKey,
    currentUser: Address
): Promise<CreateAppSessionResult> => {
    try {
        if (!sessionKey) {
            return { success: false, error: 'No session key available' };
        }

        if (!currentUser) {
            return { success: false, error: 'User not authenticated' };
        }

        const signer = createECDSAMessageSigner(sessionKey.privateKey);
        
        const appDefinition: RPCAppDefinition = {
            protocol: params.protocol || 'nitroliterpc',
            participants: params.participants as `0x${string}`[],
            weights: params.weights || params.participants.map(() => Math.floor(100 / params.participants.length)),
            quorum: params.quorum || 80,
            challenge: 0,
            nonce: Date.now(),
        };

        const allocations: RPCAppSessionAllocation[] = params.allocations.map(alloc => ({
            participant: alloc.participant as `0x${string}`,
            asset: alloc.asset,
            amount: alloc.amount
        }));

        const signedMessage = await createAppSessionMessage(signer, {
            definition: appDefinition,
            allocations,
        });

        console.log('Creating app session with:', {
            participants: params.participants.length,
            allocations: allocations.length,
            protocol: appDefinition.protocol
        });

        // Send via WebSocket and wait for response
        return new Promise((resolve) => {
            const messageHandler = (data: any) => {
                try {
                    const response = parseCreateAppSessionResponse(JSON.stringify(data));
                    if (response?.params?.appSessionId) {
                        webSocketService.removeMessageListener(messageHandler);
                        console.log('App session created successfully:', response.params.appSessionId);
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
                resolve({ success: false, error: 'Timeout waiting for session creation' });
            }, 30000);
        });

    } catch (error) {
        console.error('Failed to create app session:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
};