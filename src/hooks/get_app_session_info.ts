import { useCallback } from 'react';
import NitroliteStore from '@/store/NitroliteStore';
import { WalletSigner } from '@/websocket/crypto';
import { NitroliteRPC, parseGetAppSessionsResponse, RPCMethod } from '@erc7824/nitrolite';
import { Address } from 'viem';

interface UseGetAppSessionsParams {
    walletAddress: Address;
    signer: WalletSigner | null;
    sendRequest: (signedMessage: string) => Promise<any>;
}

export function useGetAppSessions({ signer, walletAddress, sendRequest }: UseGetAppSessionsParams) {
    const getAppSessions = useCallback(async () => {
        if (!signer) {
            console.error('Signer not available.');
            return;
        }

        try {
            const timestamp = Date.now();
            const requestId = Math.floor(Math.random() * 1000000);

            const request = NitroliteRPC.createRequest({
                requestId,
                method: RPCMethod.GetAppSessions,
                params: { participant: walletAddress },
                timestamp,
            });
            const signedRequest = await NitroliteRPC.signRequestMessage(request, signer.sign);

            // Send the request to the server
            const response = await sendRequest(JSON.stringify(signedRequest));
            const parsedResponse = parseGetAppSessionsResponse(response);

            const appSessions = parsedResponse.params.appSessions.map((session) => ({
                app_session_id: session.appSessionId,
                nonce: session.nonce,
                participants: session.participants,
                protocol: session.protocol,
                quorum: session.quorum,
                status: session.status,
                version: session.version,
                weights: session.weights,
            }));

            // Update the store with the app sessions
            NitroliteStore.setAppSessions(appSessions);

            return appSessions;
        } catch (error) {
            console.error('Error getting app sessions:', error);
            NitroliteStore.setAppSessions([]);
            return [];
        }
    }, [signer, sendRequest]);

    return {
        getAppSessions,
    };
}