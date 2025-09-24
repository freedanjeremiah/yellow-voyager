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
        console.log('📝 Adding result:', result);
        setOperationResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
    };

    // Debug function to test WebSocket
    const testWebSocket = () => {
        console.log('🧪 Testing WebSocket connection...');
        addResult('🧪 Testing WebSocket connection...');
        
        if (wsStatus === 'Connected') {
            addResult('✅ WebSocket is connected');
            console.log('✅ WebSocket is connected');
        } else {
            addResult(`❌ WebSocket is ${wsStatus}`);
            console.log(`❌ WebSocket is ${wsStatus}`);
        }
        
        if (sessionKey) {
            addResult('✅ Session key is available');
            console.log('✅ Session key is available:', sessionKey.address);
        } else {
            addResult('❌ No session key');
            console.log('❌ No session key');
        }
        
        if (isAuthenticated) {
            addResult('✅ User is authenticated');
            console.log('✅ User is authenticated');
        } else {
            addResult('❌ User not authenticated');
            console.log('❌ User not authenticated');
        }
    };

    // Initialize session key and websocket
    useEffect(() => {
        const existingSessionKey = getStoredSessionKey();
        if (existingSessionKey) {
            setSessionKey(existingSessionKey);
            console.log('🔑 Loaded existing session key:', existingSessionKey.address);
        } else {
            const newSessionKey = generateSessionKey();
            storeSessionKey(newSessionKey);
            setSessionKey(newSessionKey);
            console.log('🔑 Generated new session key:', newSessionKey.address);
        }

        console.log('🌐 Initializing WebSocket connection...');
        webSocketService.addStatusListener(setWsStatus);
        webSocketService.connect();

        return () => {
            webSocketService.removeStatusListener(setWsStatus);
        };
    }, []);

    // Auto-trigger authentication
    useEffect(() => {
        console.log('🔐 Auth effect triggered with:', { account, sessionKey: !!sessionKey, wsStatus, isAuthenticated, isAuthAttempted });
        
        if (account && sessionKey && wsStatus === 'Connected' && !isAuthenticated && !isAuthAttempted) {
            console.log('✅ All prerequisites met, starting authentication...');
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

            console.log('📤 Sending auth request with params:', authParams);
            createAuthRequestMessage(authParams).then((payload) => {
                console.log('🔐 Auth message created, sending...');
                webSocketService.send(payload);
            });
        } else {
            console.log('⏳ Auth prerequisites not met:', {
                hasAccount: !!account,
                hasSessionKey: !!sessionKey,
                wsConnected: wsStatus === 'Connected',
                notAuthenticated: !isAuthenticated,
                notAttempted: !isAuthAttempted
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
        console.log('🎯 handleCreateSession called with participantB:', participantB);
        
        if (!participantB) {
            addResult('Error: Please enter participant B address');
            return;
        }

        addResult('Creating session...');
        console.log('📞 Calling sessionManager.createReputationSession...');
        const result = await sessionManager.createReputationSession([participantB as Address], 'demo');
        console.log('📊 Session creation result:', result);
        
        if (result.success) {
            addResult(`✅ Session created: ${result.appSessionId}`);
        } else {
            addResult(`❌ Failed to create session: ${result.error}`);
        }
    };

    const handleSubmitState = async () => {
        console.log('🎯 handleSubmitState called');
        console.log('📊 Current session ID:', sessionManager.currentSessionId);
        console.log('📄 Session data:', sessionData);
        
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
            
            console.log('🔄 Parsed reputation data:', reputationData);

            addResult('Submitting state...');
            console.log('📞 Calling sessionManager.submitReputationState...');
            const result = await sessionManager.submitReputationState(
                sessionManager.currentSessionId, 
                reputationData
            );
            
            console.log('📊 Submit state result:', result);

            if (result.success) {
                addResult(`✅ State submitted successfully`);
            } else {
                addResult(`❌ Failed to submit state: ${result.error}`);
            }
        } catch (error) {
            console.error('💥 Exception in handleSubmitState:', error);
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
        <div style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
            padding: '2rem', 
            maxWidth: '1200px', 
            margin: '0 auto',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            minHeight: '100vh',
            color: '#ffffff'
        }}>
            {/* Header */}
            <header style={{ 
                marginBottom: '2rem', 
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)', 
                paddingBottom: '1rem',
                backdropFilter: 'blur(10px)',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
                <h1 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '3rem', 
                    color: '#ffffff',
                    fontWeight: '700',
                    background: 'linear-gradient(45deg, #ffffff, #f0f9ff)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Nexus Session Manager
                </h1>
                <p style={{ 
                    margin: '0', 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    fontSize: '1.2rem',
                    fontWeight: '300'
                }}>
                    Advanced Nitrolite session management with reputation integration
                </p>
                
                <div style={{ 
                    marginTop: '1.5rem', 
                    display: 'flex', 
                    gap: '1rem', 
                    alignItems: 'center', 
                    flexWrap: 'wrap' 
                }}>
                    {/* Balance Display */}
                    {isAuthenticated && (
                        <div style={{ 
                            padding: '0.75rem 1.25rem', 
                            background: 'linear-gradient(45deg, #00d4aa, #00b894)',
                            border: 'none',
                            borderRadius: '25px',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            color: '#ffffff',
                            boxShadow: '0 4px 15px rgba(0, 212, 170, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            💰 {isLoadingBalances ? 'Loading...' : `${balances?.['usdc'] || '0.00'} USDC`}
                        </div>
                    )}
                    
                    {/* WebSocket Status */}
                    <div style={{ 
                        padding: '0.75rem 1.25rem', 
                        background: wsStatus === 'Connected' 
                            ? 'linear-gradient(45deg, #00b894, #00a085)' 
                            : 'linear-gradient(45deg, #e17055, #d63031)',
                        border: 'none',
                        borderRadius: '25px',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#ffffff',
                        boxShadow: wsStatus === 'Connected' 
                            ? '0 4px 15px rgba(0, 184, 148, 0.3)'
                            : '0 4px 15px rgba(225, 112, 85, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{ fontSize: '1.1rem' }}>{wsStatus === 'Connected' ? '🟢' : '🔴'}</span>
                        {wsStatus}
                    </div>

                    {/* Wallet Info */}
                    {account ? (
                        <div style={{ 
                            padding: '0.75rem 1.25rem',
                            background: isAuthenticated 
                                ? 'linear-gradient(45deg, #6c5ce7, #5a67d8)' 
                                : 'linear-gradient(45deg, #fdcb6e, #e17055)',
                            border: 'none',
                            borderRadius: '25px',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            color: '#ffffff',
                            boxShadow: isAuthenticated 
                                ? '0 4px 15px rgba(108, 92, 231, 0.3)'
                                : '0 4px 15px rgba(253, 203, 110, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span style={{ fontSize: '1.1rem' }}>{isAuthenticated ? '✅' : '⏳'}</span>
                            {formatAddress(account)}
                        </div>
                    ) : (
                        <button 
                            onClick={connectWallet}
                            style={{ 
                                padding: '0.75rem 1.5rem', 
                                background: 'linear-gradient(45deg, #6c5ce7, #5a67d8)',
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '25px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: '600',
                                boxShadow: '0 4px 15px rgba(108, 92, 231, 0.3)',
                                transition: 'all 0.3s ease',
                                transform: 'translateY(0)',
                            }}
                            onMouseOver={(e: any) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(108, 92, 231, 0.4)';
                            }}
                            onMouseOut={(e: any) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 15px rgba(108, 92, 231, 0.3)';
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
                    padding: '1.5rem', 
                    background: 'linear-gradient(45deg, #fdcb6e, #e17055)', 
                    color: 'white', 
                    borderRadius: '12px', 
                    marginBottom: '2rem',
                    boxShadow: '0 4px 15px rgba(253, 203, 110, 0.3)',
                    fontSize: '1.1rem',
                    fontWeight: '500'
                }}>
                    {transferStatus}
                </div>
            )}

            <div style={{ 
                display: 'grid', 
                gap: '2rem', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))'
            }}>
                {/* Session Management Controls */}
                <section style={{ 
                    background: 'rgba(255, 255, 255, 0.15)', 
                    padding: '2rem', 
                    borderRadius: '16px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{ 
                        margin: '0 0 1.5rem 0', 
                        color: '#ffffff',
                        fontSize: '1.5rem',
                        fontWeight: '600'
                    }}>Session Management</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontWeight: '600',
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: '0.95rem'
                            }}>
                                Participant B Address:
                            </label>
                            <input
                                type="text"
                                placeholder="0x..."
                                value={participantB}
                                onInput={(e: any) => setParticipantB(e.currentTarget.value)}
                                style={{ 
                                    width: '100%', 
                                    padding: '0.75rem 1rem', 
                                    border: '2px solid rgba(255, 255, 255, 0.2)', 
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#ffffff',
                                    fontSize: '0.95rem',
                                    backdropFilter: 'blur(10px)',
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e: any) => {
                                    e.target.style.border = '2px solid rgba(108, 92, 231, 0.6)';
                                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                                }}
                                onBlur={(e: any) => {
                                    e.target.style.border = '2px solid rgba(255, 255, 255, 0.2)';
                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontWeight: '600',
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: '0.95rem'
                            }}>
                                Session Data (JSON):
                            </label>
                            <textarea
                                value={sessionData}
                                onInput={(e: any) => setSessionData(e.currentTarget.value)}
                                rows={3}
                                style={{ 
                                    width: '100%', 
                                    padding: '0.75rem 1rem', 
                                    border: '2px solid rgba(255, 255, 255, 0.2)', 
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#ffffff',
                                    fontFamily: 'Consolas, Monaco, monospace',
                                    fontSize: '0.9rem',
                                    backdropFilter: 'blur(10px)',
                                    resize: 'vertical',
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e: any) => {
                                    e.target.style.border = '2px solid rgba(108, 92, 231, 0.6)';
                                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                                }}
                                onBlur={(e: any) => {
                                    e.target.style.border = '2px solid rgba(255, 255, 255, 0.2)';
                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr 1fr' }}>
                            <button
                                onClick={testWebSocket}
                                style={{ 
                                    padding: '0.85rem 1.25rem', 
                                    background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                                    transition: 'all 0.3s ease',
                                    transform: 'translateY(0)'
                                }}
                                onMouseOver={(e: any) => {
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
                                }}
                                onMouseOut={(e: any) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)';
                                }}
                            >
                                🧪 Test Connection
                            </button>
                            <button
                                onClick={handleCreateSession}
                                disabled={!isAuthenticated || sessionManager.isCreatingSession}
                                style={{ 
                                    padding: '0.85rem 1.25rem', 
                                    background: sessionManager.isCreatingSession 
                                        ? 'rgba(156, 163, 175, 0.5)' 
                                        : 'linear-gradient(45deg, #00b894, #00a085)',
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '8px',
                                    cursor: sessionManager.isCreatingSession ? 'not-allowed' : 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    boxShadow: sessionManager.isCreatingSession 
                                        ? 'none' 
                                        : '0 4px 15px rgba(0, 184, 148, 0.3)',
                                    transition: 'all 0.3s ease',
                                    transform: 'translateY(0)'
                                }}
                                onMouseOver={!sessionManager.isCreatingSession ? (e: any) => {
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(0, 184, 148, 0.4)';
                                } : undefined}
                                onMouseOut={!sessionManager.isCreatingSession ? (e: any) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(0, 184, 148, 0.3)';
                                } : undefined}
                            >
                                {sessionManager.isCreatingSession ? 'Creating...' : 'Create Session'}
                            </button>

                            <button
                                onClick={handleSubmitState}
                                disabled={!sessionManager.currentSessionId || sessionManager.isSubmittingState}
                                style={{ 
                                    padding: '0.85rem 1.25rem', 
                                    background: sessionManager.isSubmittingState 
                                        ? 'rgba(156, 163, 175, 0.5)' 
                                        : 'linear-gradient(45deg, #0ea5e9, #0284c7)',
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '8px',
                                    cursor: sessionManager.isSubmittingState ? 'not-allowed' : 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    boxShadow: sessionManager.isSubmittingState 
                                        ? 'none' 
                                        : '0 4px 15px rgba(14, 165, 233, 0.3)',
                                    transition: 'all 0.3s ease',
                                    transform: 'translateY(0)'
                                }}
                                onMouseOver={!sessionManager.isSubmittingState ? (e: any) => {
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.4)';
                                } : undefined}
                                onMouseOut={!sessionManager.isSubmittingState ? (e: any) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(14, 165, 233, 0.3)';
                                } : undefined}
                            >
                                {sessionManager.isSubmittingState ? 'Submitting...' : 'Submit State'}
                            </button>

                            <button
                                onClick={handleCloseSession}
                                disabled={!sessionManager.currentSessionId || sessionManager.isClosingSession}
                                style={{ 
                                    padding: '0.85rem 1.25rem', 
                                    background: sessionManager.isClosingSession 
                                        ? 'rgba(156, 163, 175, 0.5)' 
                                        : 'linear-gradient(45deg, #e17055, #d63031)',
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '8px',
                                    cursor: sessionManager.isClosingSession ? 'not-allowed' : 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    boxShadow: sessionManager.isClosingSession 
                                        ? 'none' 
                                        : '0 4px 15px rgba(225, 112, 85, 0.3)',
                                    transition: 'all 0.3s ease',
                                    transform: 'translateY(0)'
                                }}
                                onMouseOver={!sessionManager.isClosingSession ? (e: any) => {
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(225, 112, 85, 0.4)';
                                } : undefined}
                                onMouseOut={!sessionManager.isClosingSession ? (e: any) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(225, 112, 85, 0.3)';
                                } : undefined}
                            >
                                {sessionManager.isClosingSession ? 'Closing...' : 'Close Session'}
                            </button>

                            <button
                                onClick={handleGetSessions}
                                disabled={!isAuthenticated || sessionManager.isLoadingSessions}
                                style={{ 
                                    padding: '0.85rem 1.25rem', 
                                    background: sessionManager.isLoadingSessions 
                                        ? 'rgba(156, 163, 175, 0.5)' 
                                        : 'linear-gradient(45deg, #6c5ce7, #5a67d8)',
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '8px',
                                    cursor: sessionManager.isLoadingSessions ? 'not-allowed' : 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    boxShadow: sessionManager.isLoadingSessions 
                                        ? 'none' 
                                        : '0 4px 15px rgba(108, 92, 231, 0.3)',
                                    transition: 'all 0.3s ease',
                                    transform: 'translateY(0)'
                                }}
                                onMouseOver={!sessionManager.isLoadingSessions ? (e: any) => {
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(108, 92, 231, 0.4)';
                                } : undefined}
                                onMouseOut={!sessionManager.isLoadingSessions ? (e: any) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(108, 92, 231, 0.3)';
                                } : undefined}
                            >
                                {sessionManager.isLoadingSessions ? 'Loading...' : 'Get Sessions'}
                            </button>
                        </div>

                        {sessionManager.currentSessionId && (
                            <div style={{ 
                                padding: '1.5rem', 
                                background: 'linear-gradient(45deg, #00b894, #00a085)', 
                                borderRadius: '8px',
                                boxShadow: '0 4px 15px rgba(0, 184, 148, 0.3)',
                                color: '#ffffff'
                            }}>
                                <strong style={{ fontSize: '1.05rem' }}>🟢 Active Session:</strong><br />
                                <code style={{ 
                                    fontSize: '0.85rem',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    display: 'block',
                                    marginTop: '0.5rem',
                                    wordBreak: 'break-all'
                                }}>{sessionManager.currentSessionId}</code>
                            </div>
                        )}
                    </div>
                </section>

                {/* Operation Results */}
                <section style={{ 
                    background: 'rgba(255, 255, 255, 0.15)', 
                    padding: '2rem', 
                    borderRadius: '16px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{ 
                        margin: '0 0 1.5rem 0', 
                        color: '#ffffff',
                        fontSize: '1.5rem',
                        fontWeight: '600'
                    }}>Operation Results</h2>
                    
                    <div style={{ 
                        maxHeight: '400px', 
                        overflowY: 'auto',
                        background: 'linear-gradient(145deg, #2d3748, #1a202c)',
                        color: '#e2e8f0',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        fontFamily: 'Consolas, Monaco, "Lucida Console", monospace',
                        fontSize: '0.9rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}>
                        {operationResults.length === 0 ? (
                            <div style={{ 
                                color: 'rgba(226, 232, 240, 0.6)',
                                textAlign: 'center',
                                fontStyle: 'italic',
                                padding: '2rem 0'
                            }}>💻 No operations yet... Connect your wallet and start a session!</div>
                        ) : (
                            operationResults.map((result, index) => (
                                <div key={index} style={{ 
                                    marginBottom: '0.75rem',
                                    padding: '0.5rem 0',
                                    borderBottom: index < operationResults.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                                    lineHeight: '1.4'
                                }}>
                                    <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>[{new Date().toLocaleTimeString()}]</span>{' '}
                                    {result}
                                </div>
                            ))
                        )}
                    </div>

                    <button
                        onClick={() => setOperationResults([])}
                        style={{ 
                            marginTop: '1rem',
                            padding: '0.75rem 1.25rem', 
                            background: 'linear-gradient(45deg, #6b7280, #4b5563)', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            boxShadow: '0 4px 15px rgba(107, 114, 128, 0.3)',
                            transition: 'all 0.3s ease',
                            transform: 'translateY(0)'
                        }}
                        onMouseOver={(e: any) => {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(107, 114, 128, 0.4)';
                        }}
                        onMouseOut={(e: any) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(107, 114, 128, 0.3)';
                        }}
                    >
                        Clear Results
                    </button>
                </section>
            </div>
        </div>
    );
}