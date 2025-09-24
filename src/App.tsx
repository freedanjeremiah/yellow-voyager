import { useState, useEffect } from 'preact/hooks';
import { createWalletClient, custom, type Address, type WalletClient } from 'viem';
import { mainnet } from 'viem/chains';

// Nitrolite imports
import {
    createAuthRequestMessage,
    createAuthVerifyMessage,
    createEIP712AuthMessageSigner,
    parseAnyRPCResponse,
    RPCMethod,
    type AuthChallengeResponse,
    type AuthRequestParams,
    createECDSAMessageSigner,
    createGetLedgerBalancesMessage,
    type GetLedgerBalancesResponse,
    type BalanceUpdateResponse,
} from '@erc7824/nitrolite';

// Custom hooks
import { useAppSessionManager } from './hooks/useAppSessionManager';

// Utilities
import { webSocketService, type WsStatus } from './lib/websocket';
import {
    generateSessionKey,
    getStoredSessionKey,
    storeSessionKey,
    storeJWT,
    type SessionKey,
} from './lib/utils';

// Types
import type { ReputationSessionData } from './types/reputation';

declare global {
    interface Window {
        ethereum?: any;
    }
}

// Authentication constants
const getAuthDomain = () => ({ name: 'Nexus' });
const AUTH_SCOPE = 'nexus.app';
const APP_NAME = 'Nexus';
const SESSION_DURATION = 3600; // 1 hour

export function App() {
    // Core state
    const [account, setAccount] = useState<Address | null>(null);
    const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
    const [wsStatus, setWsStatus] = useState<WsStatus>('Disconnected');
    
    // Authentication state
    const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthAttempted, setIsAuthAttempted] = useState(false);
    const [sessionExpireTimestamp, setSessionExpireTimestamp] = useState<string>('');
    
    // Balance state
    const [balances, setBalances] = useState<Record<string, string> | null>(null);
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);
    
    // Transfer state
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferStatus, setTransferStatus] = useState<string | null>(null);

    // Demo session management state
    const [participantB, setParticipantB] = useState<string>('');
    const [sessionData, setSessionData] = useState<string>('{"reputation": {"technical": 85, "community": 90}}');
    const [operationResults, setOperationResults] = useState<string[]>([]);

    // Custom hooks
    const sessionManager = useAppSessionManager(sessionKey, isAuthenticated, account);

    // Helper to add operation results
    const addResult = (result: string) => {
        setOperationResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
    };

    // Initialize session key and websocket
    useEffect(() => {
        const existingSessionKey = getStoredSessionKey();
        if (existingSessionKey) {
            setSessionKey(existingSessionKey);
        } else {
            const newSessionKey = generateSessionKey();
            storeSessionKey(newSessionKey);
            setSessionKey(newSessionKey);
        }

        webSocketService.addStatusListener(setWsStatus);
        webSocketService.connect();

        return () => {
            webSocketService.removeStatusListener(setWsStatus);
        };
    }, []);

    // Auto-trigger authentication
    useEffect(() => {
        if (account && sessionKey && wsStatus === 'Connected' && !isAuthenticated && !isAuthAttempted) {
            setIsAuthAttempted(true);
            const expireTimestamp = String(Math.floor(Date.now() / 1000) + SESSION_DURATION);
            setSessionExpireTimestamp(expireTimestamp);

            const authParams: AuthRequestParams = {
                address: account,
                session_key: sessionKey.address,
                app_name: APP_NAME,
                expire: expireTimestamp,
                scope: AUTH_SCOPE,
                application: account,
                allowances: [],
            };

            createAuthRequestMessage(authParams).then((payload) => {
                webSocketService.send(payload);
            });
        }
    }, [account, sessionKey, wsStatus, isAuthenticated, isAuthAttempted]);

    // Auto-fetch balances when authenticated
    useEffect(() => {
        if (isAuthenticated && sessionKey && account) {
            setIsLoadingBalances(true);
            const sessionSigner = createECDSAMessageSigner(sessionKey.privateKey);

            createGetLedgerBalancesMessage(sessionSigner, account)
                .then((getBalancesPayload) => {
                    webSocketService.send(getBalancesPayload);
                })
                .catch((error) => {
                    console.error('Failed to create balance request:', error);
                    setIsLoadingBalances(false);
                });
        }
    }, [isAuthenticated, sessionKey, account]);

    // Demo session handlers
    const handleCreateSession = async () => {
        if (!participantB) {
            addResult('Error: Please enter participant B address');
            return;
        }

        addResult('Creating session...');
        const result = await sessionManager.createReputationSession([participantB as Address], 'demo');
        
        if (result.success) {
            addResult(`✅ Session created: ${result.appSessionId}`);
        } else {
            addResult(`❌ Failed to create session: ${result.error}`);
        }
    };

    const handleSubmitState = async () => {
        if (!sessionManager.currentSessionId) {
            addResult('Error: No active session. Create a session first.');
            return;
        }

        try {
            const reputationData: ReputationSessionData = {
                sessionType: 'reputation_update',
                timestamp: Date.now(),
                reputationScores: JSON.parse(sessionData),
                verificationMethod: 'peer_review',
                category: 'demo',
                submittedBy: account!
            };

            addResult('Submitting state...');
            const result = await sessionManager.submitReputationState(
                sessionManager.currentSessionId, 
                reputationData
            );

            if (result.success) {
                addResult(`✅ State submitted successfully`);
            } else {
                addResult(`❌ Failed to submit state: ${result.error}`);
            }
        } catch (error) {
            addResult(`❌ Invalid session data JSON: ${error}`);
        }
    };

    const handleCloseSession = async () => {
        if (!sessionManager.currentSessionId) {
            addResult('Error: No active session to close');
            return;
        }

        addResult('Closing session...');
        const finalAllocations = [
            { participant: account!, asset: 'usdc', amount: '0' }
        ];

        const result = await sessionManager.closeReputationSession(
            sessionManager.currentSessionId,
            finalAllocations
        );

        if (result.success) {
            addResult(`✅ Session closed successfully`);
        } else {
            addResult(`❌ Failed to close session: ${result.error}`);
        }
    };

    const handleGetSessions = async () => {
        addResult('Loading sessions...');
        const result = await sessionManager.getReputationSessions();
        
        if (result.success) {
            const count = result.sessions?.length || 0;
            addResult(`✅ Found ${count} sessions`);
            if (count > 0) {
                result.sessions!.forEach((session, i) => {
                    addResult(`  ${i + 1}. ${session.appSessionId} (${session.status})`);
                });
            }
        } else {
            addResult(`❌ Failed to get sessions: ${result.error}`);
        }
    };

    // Handle server messages
    useEffect(() => {
        const handleMessage = async (data: any) => {
            const response = parseAnyRPCResponse(JSON.stringify(data));

            // Handle auth challenge
            if (
                response.method === RPCMethod.AuthChallenge &&
                walletClient &&
                sessionKey &&
                account &&
                sessionExpireTimestamp
            ) {
                const challengeResponse = response as AuthChallengeResponse;
                const authParams = {
                    scope: AUTH_SCOPE,
                    application: walletClient.account?.address as `0x${string}`,
                    participant: sessionKey.address as `0x${string}`,
                    expire: sessionExpireTimestamp,
                    allowances: [],
                };

                const eip712Signer = createEIP712AuthMessageSigner(walletClient, authParams, getAuthDomain());

                try {
                    const authVerifyPayload = await createAuthVerifyMessage(eip712Signer, challengeResponse);
                    webSocketService.send(authVerifyPayload);
                } catch (error) {
                    alert('Signature rejected. Please try again.');
                    setIsAuthAttempted(false);
                }
            }

            // Handle auth success
            if (response.method === RPCMethod.AuthVerify && response.params?.success) {
                setIsAuthenticated(true);
                addResult('✅ Authentication successful');
                if (response.params.jwtToken) storeJWT(response.params.jwtToken);
            }

            // Handle balance responses
            if (response.method === RPCMethod.GetLedgerBalances) {
                const balanceResponse = response as GetLedgerBalancesResponse;
                const balances = balanceResponse.params.ledgerBalances;

                if (balances && balances.length > 0) {
                    const balancesMap = Object.fromEntries(
                        balances.map((balance) => [balance.asset, balance.amount]),
                    );
                    setBalances(balancesMap);
                    addResult(`💰 Balances updated: ${Object.keys(balancesMap).length} assets`);
                } else {
                    setBalances({});
                }
                setIsLoadingBalances(false);
            }

            // Handle balance updates
            if (response.method === RPCMethod.BalanceUpdate) {
                const balanceUpdate = response as BalanceUpdateResponse;
                const balances = balanceUpdate.params.balanceUpdates;
                const balancesMap = Object.fromEntries(
                    balances.map((balance) => [balance.asset, balance.amount]),
                );
                setBalances(balancesMap);
                addResult('💰 Live balance update received');
            }

            // Handle transfer response
            if (response.method === RPCMethod.Transfer) {
                setIsTransferring(false);
                setTransferStatus(null);
                addResult('✅ Transfer completed successfully');
            }

            // Handle errors
            if (response.method === RPCMethod.Error) {
                console.error('RPC Error:', response.params);
                addResult(`❌ RPC Error: ${response.params.error}`);
                
                if (isTransferring) {
                    setIsTransferring(false);
                    setTransferStatus(null);
                }
            }
        };

        webSocketService.addMessageListener(handleMessage);
        return () => webSocketService.removeMessageListener(handleMessage);
    }, [walletClient, sessionKey, sessionExpireTimestamp, account, isTransferring]);

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert('MetaMask not found! Please install MetaMask from https://metamask.io/');
            return;
        }

        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== '0x1') {
                alert('Please switch to Ethereum Mainnet in MetaMask for this workshop');
            }

            const tempClient = createWalletClient({
                chain: mainnet,
                transport: custom(window.ethereum),
            });
            const [address] = await tempClient.requestAddresses();

            if (!address) {
                alert('No wallet address found. Please ensure MetaMask is unlocked.');
                return;
            }

            const walletClient = createWalletClient({
                account: address,
                chain: mainnet,
                transport: custom(window.ethereum),
            });

            setWalletClient(walletClient);
            setAccount(address);
            addResult(`🔗 Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
        } catch (error) {
            console.error('Wallet connection failed:', error);
            alert('Failed to connect wallet. Please try again.');
        }
    };

    const formatAddress = (address: Address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
        <div style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <header style={{ marginBottom: '2rem', borderBottom: '1px solid #e5e5e5', paddingBottom: '1rem' }}>
                <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#1a1a1a' }}>
                    Nexus Session Manager
                </h1>
                <p style={{ margin: '0', color: '#666', fontSize: '1.1rem' }}>
                    Advanced Nitrolite session management with reputation integration
                </p>
                
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Balance Display */}
                    {isAuthenticated && (
                        <div style={{ 
                            padding: '0.5rem 1rem', 
                            background: '#f0f9ff', 
                            border: '1px solid #0ea5e9', 
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                        }}>
                            💰 {isLoadingBalances ? 'Loading...' : `${balances?.['usdc'] || '0.00'} USDC`}
                        </div>
                    )}
                    
                    {/* WebSocket Status */}
                    <div style={{ 
                        padding: '0.5rem 1rem', 
                        background: wsStatus === 'Connected' ? '#dcfce7' : '#fef2f2',
                        border: `1px solid ${wsStatus === 'Connected' ? '#10b981' : '#ef4444'}`,
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                    }}>
                        {wsStatus === 'Connected' ? '🟢' : '🔴'} {wsStatus}
                    </div>

                    {/* Wallet Info */}
                    {account ? (
                        <div style={{ 
                            padding: '0.5rem 1rem',
                            background: isAuthenticated ? '#dcfce7' : '#fbbf24',
                            border: `1px solid ${isAuthenticated ? '#10b981' : '#f59e0b'}`,
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                        }}>
                            {isAuthenticated ? '✅' : '⏳'} {formatAddress(account)}
                        </div>
                    ) : (
                        <button 
                            onClick={connectWallet}
                            style={{ 
                                padding: '0.5rem 1rem', 
                                background: '#2563eb', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Connect Wallet
                        </button>
                    )}
                </div>
            </header>

            {/* Status Messages */}
            {transferStatus && (
                <div style={{ 
                    padding: '1rem', 
                    background: '#fbbf24', 
                    color: 'white', 
                    borderRadius: '6px', 
                    marginBottom: '1rem' 
                }}>
                    {transferStatus}
                </div>
            )}

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1fr' }}>
                {/* Session Management Controls */}
                <section style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '8px' }}>
                    <h2 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Session Management</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                Participant B Address:
                            </label>
                            <input
                                type="text"
                                placeholder="0x..."
                                value={participantB}
                                onInput={(e: any) => setParticipantB(e.currentTarget.value)}
                                style={{ 
                                    width: '100%', 
                                    padding: '0.5rem', 
                                    border: '1px solid #d1d5db', 
                                    borderRadius: '4px' 
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                Session Data (JSON):
                            </label>
                            <textarea
                                value={sessionData}
                                onInput={(e: any) => setSessionData(e.currentTarget.value)}
                                rows={3}
                                style={{ 
                                    width: '100%', 
                                    padding: '0.5rem', 
                                    border: '1px solid #d1d5db', 
                                    borderRadius: '4px',
                                    fontFamily: 'monospace',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr 1fr' }}>
                            <button
                                onClick={handleCreateSession}
                                disabled={!isAuthenticated || sessionManager.isCreatingSession}
                                style={{ 
                                    padding: '0.75rem', 
                                    background: sessionManager.isCreatingSession ? '#9ca3af' : '#059669',
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px',
                                    cursor: sessionManager.isCreatingSession ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {sessionManager.isCreatingSession ? 'Creating...' : 'Create Session'}
                            </button>

                            <button
                                onClick={handleSubmitState}
                                disabled={!sessionManager.currentSessionId || sessionManager.isSubmittingState}
                                style={{ 
                                    padding: '0.75rem', 
                                    background: sessionManager.isSubmittingState ? '#9ca3af' : '#0ea5e9',
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px',
                                    cursor: sessionManager.isSubmittingState ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {sessionManager.isSubmittingState ? 'Submitting...' : 'Submit State'}
                            </button>

                            <button
                                onClick={handleCloseSession}
                                disabled={!sessionManager.currentSessionId || sessionManager.isClosingSession}
                                style={{ 
                                    padding: '0.75rem', 
                                    background: sessionManager.isClosingSession ? '#9ca3af' : '#dc2626',
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px',
                                    cursor: sessionManager.isClosingSession ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {sessionManager.isClosingSession ? 'Closing...' : 'Close Session'}
                            </button>

                            <button
                                onClick={handleGetSessions}
                                disabled={!isAuthenticated || sessionManager.isLoadingSessions}
                                style={{ 
                                    padding: '0.75rem', 
                                    background: sessionManager.isLoadingSessions ? '#9ca3af' : '#7c2d12',
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px',
                                    cursor: sessionManager.isLoadingSessions ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {sessionManager.isLoadingSessions ? 'Loading...' : 'Get Sessions'}
                            </button>
                        </div>

                        {sessionManager.currentSessionId && (
                            <div style={{ 
                                padding: '1rem', 
                                background: '#ecfccb', 
                                border: '1px solid #84cc16',
                                borderRadius: '4px' 
                            }}>
                                <strong>Active Session:</strong><br />
                                <code style={{ fontSize: '0.8rem' }}>{sessionManager.currentSessionId}</code>
                            </div>
                        )}
                    </div>
                </section>

                {/* Operation Results */}
                <section style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '8px' }}>
                    <h2 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Operation Results</h2>
                    
                    <div style={{ 
                        maxHeight: '400px', 
                        overflowY: 'auto',
                        background: '#1f2937',
                        color: '#e5e7eb',
                        padding: '1rem',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem'
                    }}>
                        {operationResults.length === 0 ? (
                            <div style={{ color: '#9ca3af' }}>No operations yet...</div>
                        ) : (
                            operationResults.map((result, index) => (
                                <div key={index} style={{ marginBottom: '0.5rem' }}>
                                    {result}
                                </div>
                            ))
                        )}
                    </div>

                    <button
                        onClick={() => setOperationResults([])}
                        style={{ 
                            marginTop: '1rem',
                            padding: '0.5rem 1rem', 
                            background: '#6b7280', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Clear Results
                    </button>
                </section>
            </div>
        </div>
    );
}