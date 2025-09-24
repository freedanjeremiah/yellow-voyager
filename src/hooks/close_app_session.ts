import { useCallback } from 'react';

import {
    createCloseAppSessionMessage,
    AccountID,
    CloseAppSessionRequestParams,
    RPCAppSessionAllocation,
    parseCloseAppSessionResponse,
} from '@erc7824/nitrolite';
import { WalletSigner } from '@/websocket/crypto';

/**
 * Hook for closing an application session using createCloseAppSessionMessage.
 */
export function useCloseApplicationSession() {
    const closeApplicationSession = useCallback(
        async (
            signer: WalletSigner,
            sendRequest: (signedMessage: string) => Promise<string>,
            appSessionId: AccountID,
            finalAllocations: RPCAppSessionAllocation[],
        ) => {
            try {
                if (!appSessionId) {
                    throw new Error('Application ID is required to close the session.');
                }

                if (!finalAllocations || finalAllocations.length === 0) {
                    throw new Error('Final allocation amounts are required.');
                }

                const closeRequest: CloseAppSessionRequestParams = {
                    app_session_id: appSessionId,
                    allocations: finalAllocations,
                };

                const signedMessage = await createCloseAppSessionMessage(signer.sign, closeRequest);

                const response = await sendRequest(signedMessage);
                const parsedResponse = parseCloseAppSessionResponse(response);

                if (parsedResponse.params.appSessionId) {
                    localStorage.removeItem('app_session_id');
                    return { success: true };
                }
            } catch (error) {
                console.error('Error creating close application session message:', error);
                return {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error during close session message preparation/sending',
                };
            }
        },
        [],
    );

    return {
        closeApplicationSession,
    };
}