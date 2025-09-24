import { useCallback } from 'preact/hooks';
import type { Address } from 'viem';
import { nitroliteStore } from '@/store';
import { nitroliteWebSocket } from '@/websocket';
import type { ReputationSessionData } from '../types/reputation';

// Mock the @erc7824/nitrolite functions for development
const createAppSessionMessage = async (signer: any, appDefinition: any) => {
    return JSON.stringify({
        method: 'create_app_session',
        params: { app_definition: appDefinition },
        id: Date.now(),
        sig: ['mock_signature']
    });
};

const parseCreateAppSessionResponse = (response: string) => {
    const parsed = JSON.parse(response);
    return { app_session_id: parsed.params?.app_session_id || `session_${Date.now()}` };
};

const DEFAULT_PROTOCOL = 'reputation_nitrolite_v1';
const DEFAULT_QUORUM = 80;

/**
 * Hook for creating a reputation application session.
 */
export function useCreateReputationSession() {
    const createReputationSession = useCallback(
        async (
            participants: Address[],
            category: string = 'reputation_scoring'
        ): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
            try {
                const currentUser = nitroliteStore.session.currentUser;
                if (!currentUser || !nitroliteStore.session.isAuthenticated) {
                    return { success: false, error: 'User not authenticated' };
                }

                const allParticipants = [currentUser, ...participants];
                const weights = allParticipants.map(() => 100 / allParticipants.length);
            try {
                if (!activeChainId) {
                    throw new Error('Active chain ID is not set.');
                }

                const challenge = 0;

                const appDefinition: RPCAppDefinition = {
                    protocol: DEFAULT_PROTOCOL,
                    participants: [participantA, participantB] as Hex[],
                    weights: DEFAULT_WEIGHTS,
                    quorum: DEFAULT_QUORUM,
                    challenge: challenge,
                    nonce: Date.now(),
                };

                const allocations: RPCAppSessionAllocation[] = [
                    {
                        participant: participantA as Hex,
                        asset: 'usdc',
                        amount,
                    },
                    {
                        participant: participantB as Hex,
                        asset: 'usdc',
                        amount: '0',
                    },
                ];

                const signedMessage = await createAppSessionMessage(signer.sign, {
                    definition: appDefinition,
                    allocations: allocations,
                });
                const response = await sendRequest(signedMessage);
                const parsedResponse = parseCreateAppSessionResponse(response);

                if (parsedResponse.params.appSessionId) {
                    localStorage.setItem('app_session_id', parsedResponse.params.appSessionId);
                    return {
                        success: true,
                        app_id: parsedResponse.params.appSessionId,
                    };
                } else {
                    return { success: true, response };
                }
            } catch (error) {
                console.error('Error creating application session message:', error);
                return {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error during session creation message preparation/sending',
                };
            }
        },
        [],
    );

    return {
        createApplicationSession,
    };
}