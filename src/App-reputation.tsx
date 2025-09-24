// Global Reputation Platform - Main App Component
import { useState, useEffect } from 'preact/hooks';
import { createWalletClient, custom, type Address, type WalletClient } from 'viem';
import { mainnet } from 'viem/chains';

// Import types and components for reputation system
import { ReputationFeed } from './components/ReputationFeed/ReputationFeed';
import { ReputationDisplay } from './components/ReputationDisplay/ReputationDisplay';
import { ReputationScoring } from './components/ReputationScoring/ReputationScoring';
import { useReputationSubmission } from './hooks/useReputationSubmission';

// Data imports
import { getRecentActions } from './data/reputation-actions';
import { sampleUsers, getUserByAddress } from './data/users';
import type { 
    ReputationAction, 
    UserProfile, 
    ViewType, 
    ReputationUpdateResponse,
    ReputationProfileResponse,
    ReputationFeedResponse
} from './types/reputation';

// WebSocket and utilities
import { webSocketService, type WsStatus } from './lib/websocket';
import {
    generateSessionKey,
    getStoredSessionKey,
    storeSessionKey,
    removeSessionKey,
    storeJWT,
    removeJWT,
    type SessionKey,
} from './lib/utils';

// Mock authentication functions (replace with actual @erc7824/nitrolite when available)
const parseAnyRPCResponse = (data: string) => JSON.parse(data);
const createAuthRequestMessage = async (params: any) => JSON.stringify({ method: 'auth_request', params });
const createAuthVerifyMessage = async (signer: any, response: any) => JSON.stringify({ method: 'auth_verify', signer, response });
const createEIP712AuthMessageSigner = (client: any, params: any, domain: any) => ({ client, params, domain });

declare global {
    interface Window {
        ethereum?: any;
    }
}

// Authentication constants
const AUTH_SCOPE = 'reputation.global';
const APP_NAME = 'Global Reputation Platform';
const SESSION_DURATION = 3600; // 1 hour

export function App() {
    // Wallet and authentication state
    const [account, setAccount] = useState<Address | null>(null);
    const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
    const [wsStatus, setWsStatus] = useState<WsStatus>('Disconnected');
    const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthAttempted, setIsAuthAttempted] = useState(false);

    // Reputation state
    const [currentView, setCurrentView] = useState<ViewType>('feed');
    const [reputationActions, setReputationActions] = useState<ReputationAction[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
    const [selectedParticipants, setSelectedParticipants] = useState<Address[]>([]);
    const [scoringCategory] = useState('General Assessment');

    // UI state
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    // Reputation hooks
    const { submitEndorsement, isCreatingSession, isSubmittingState } = useReputationSubmission(sessionKey, isAuthenticated, account);

    // Initialize session key and WebSocket connection
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

        // Initialize with sample data
        setReputationActions(getRecentActions(15));
        const profilesMap = new Map<string, UserProfile>();
        sampleUsers.forEach(user => {
            profilesMap.set(user.address.toLowerCase(), user);
        });
        setProfiles(profilesMap);

        return () => {
            webSocketService.removeStatusListener(setWsStatus);
        };
    }, []);

    // Auto-trigger authentication when conditions are met
    useEffect(() => {
        if (account && sessionKey && wsStatus === 'Connected' && !isAuthenticated && !isAuthAttempted) {
            setIsAuthAttempted(true);
            
            const expireTimestamp = String(Math.floor(Date.now() / 1000) + SESSION_DURATION);
            const authParams = {
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

    // Load user profile when authenticated
    useEffect(() => {
        if (isAuthenticated && account) {
            const profile = getUserByAddress(account);
            if (profile) {
                setUserProfile(profile);
            } else {
                // Create default profile for new users
                const defaultProfile: UserProfile = {
                    address: account,
                    reputation: {
                        technical: 0,
                        community: 0,
                        trustworthiness: 0,
                        expertise: 0,
                        overall: 0,
                        lastUpdated: Date.now(),
                        totalInteractions: 0
                    },
                    recentActions: [],
                    badges: [],
                    endorsements: [],
                    joinedAt: Date.now(),
                    isVerified: false
                };
                setUserProfile(defaultProfile);
                setProfiles(prev => new Map(prev.set(account.toLowerCase(), defaultProfile)));
            }
        }
    }, [isAuthenticated, account]);

    // Handle WebSocket messages
    useEffect(() => {
        const handleMessage = async (data: any) => {
            try {
                const response = parseAnyRPCResponse(JSON.stringify(data));
                
                // Handle authentication challenge
                if (response.method === 'auth_challenge') {
                    const challengeResponse = response as any;
                    const authParams = {
                        address: account,
                        session_key: sessionKey?.address,
                        app_name: APP_NAME,
                        scope: AUTH_SCOPE,
                    };
                    
                    const eip712Signer = createEIP712AuthMessageSigner(walletClient, authParams, { name: APP_NAME });
                    const authVerifyPayload = await createAuthVerifyMessage(eip712Signer, challengeResponse);
                    webSocketService.send(authVerifyPayload);
                }

                // Handle successful authentication
                if (response.method === 'auth_verify' && response.params?.success) {
                    console.log('Authentication successful!');
                    setIsAuthenticated(true);
                    if (response.params.jwtToken) {
                        storeJWT(response.params.jwtToken);
                    }
                }

                // Handle reputation updates
                if (response.method === 'reputation_update') {
                    const update = response as ReputationUpdateResponse;
                    setReputationActions(prev => [update.params.action, ...prev.slice(0, 19)]);
                    
                    // Update profile if it affects current user
                    if (update.params.updatedProfile && update.params.action.to === account) {
                        setUserProfile(update.params.updatedProfile);
                    }
                }

                // Handle profile responses
                if (response.method === 'get_reputation_profile') {
                    const profileResponse = response as ReputationProfileResponse;
                    setUserProfile(profileResponse.params.profile);
                    setIsLoadingProfile(false);
                }

                // Handle feed responses
                if (response.method === 'get_reputation_feed') {
                    const feedResponse = response as ReputationFeedResponse;
                    setReputationActions(feedResponse.params.actions);
                }

                // Handle errors
                if (response.method === 'error') {
                    console.error('Server error:', response.params?.message);
                    setStatusMessage(`Error: ${response.params?.message || 'Unknown error'}`);
                }

            } catch (error) {
                console.error('Failed to parse message:', error);
            }
        };

        webSocketService.addMessageListener(handleMessage);
        return () => webSocketService.removeMessageListener(handleMessage);
    }, [account, sessionKey, walletClient]);

    // Wallet connection functions
    const connectWallet = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask or another Web3 wallet');
            return;
        }

        try {
            const walletClient = createWalletClient({
                chain: mainnet,
                transport: custom(window.ethereum)
            });

            const [address] = await walletClient.requestAddresses();
            setAccount(address);
            setWalletClient(walletClient);
            setIsAuthAttempted(false); // Reset auth attempt for new wallet
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            alert('Failed to connect wallet. Please try again.');
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setWalletClient(null);
        setIsAuthenticated(false);
        setIsAuthAttempted(false);
        setUserProfile(null);
        removeSessionKey();
        removeJWT();
        
        // Generate new session key for future use
        const newSessionKey = generateSessionKey();
        storeSessionKey(newSessionKey);
        setSessionKey(newSessionKey);
    };

    // Reputation actions
    const handleEndorse = async (recipient: string, category: 'technical' | 'community' | 'trustworthiness' | 'expertise', score: number) => {
        if (!isAuthenticated || !account) {
            alert('Please authenticate first');
            return;
        }

        setStatusMessage('Processing endorsement...');

        try {
            const result = await submitEndorsement(recipient as Address, category, score, `Endorsement from ${account}`);
            
            if (result.success) {
                setStatusMessage('Endorsement submitted successfully!');
                // Add optimistic update
                const newAction: ReputationAction = {
                    id: `temp_${Date.now()}`,
                    type: 'endorsement',
                    from: account,
                    to: recipient as Address,
                    category,
                    score,
                    description: `Endorsement from ${account}`,
                    timestamp: Date.now(),
                    verified: false,
                    sessionId: result.sessionId || 'temp'
                };
                setReputationActions(prev => [newAction, ...prev]);
            } else {
                setStatusMessage(`Failed to submit endorsement: ${result.error}`);
            }
        } catch (error) {
            setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        setTimeout(() => setStatusMessage(null), 3000);
    };

    const handleScoringSubmit = () => {
        if (selectedParticipants.length === 0) {
            alert('Please select participants for scoring');
            return;
        }
        setCurrentView('scoring');
    };

    // UI helper functions
    const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
    
    const getDisplayName = (address: Address) => {
        const profile = profiles.get(address.toLowerCase());
        return profile?.username || formatAddress(address);
    };

    return (
        <div className="app-container">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div className="logo-section">
                        <h1 className="logo">🌐 ReputationHub</h1>
                        <p className="tagline">Global reputation network for the decentralized world</p>
                    </div>
                    
                    <nav className="main-nav">
                        <button 
                            className={currentView === 'feed' ? 'nav-button active' : 'nav-button'} 
                            onClick={() => setCurrentView('feed')}
                        >
                            📊 Activity Feed
                        </button>
                        <button 
                            className={currentView === 'profile' ? 'nav-button active' : 'nav-button'} 
                            onClick={() => setCurrentView('profile')}
                        >
                            👤 My Profile
                        </button>
                        <button 
                            className={currentView === 'discover' ? 'nav-button active' : 'nav-button'} 
                            onClick={() => setCurrentView('discover')}
                        >
                            🔍 Discover
                        </button>
                    </nav>
                </div>

                <div className="header-controls">
                    {/* Reputation Display */}
                    {isAuthenticated && userProfile && (
                        <div className="reputation-widget">
                            <ReputationDisplay reputation={userProfile.reputation} isLoading={isLoadingProfile} />
                        </div>
                    )}
                    
                    {/* WebSocket Status */}
                    <div className={`ws-status ws-status-${wsStatus.toLowerCase()}`}>
                        <span className="status-indicator"></span>
                        <span className="status-text">{wsStatus}</span>
                    </div>
                    
                    {/* Wallet Controls */}
                    {account ? (
                        <div className="wallet-info">
                            <span className="wallet-address">{getDisplayName(account)}</span>
                            {isAuthenticated && <span className="auth-badge">✅ Verified</span>}
                            <button onClick={disconnectWallet} className="disconnect-btn">Disconnect</button>
                        </div>
                    ) : (
                        <button onClick={connectWallet} className="connect-btn">Connect Wallet</button>
                    )}
                </div>
            </header>

            {/* Status Messages */}
            {statusMessage && (
                <div className="status-banner">
                    <span>{statusMessage}</span>
                </div>
            )}

            {/* Main Content */}
            <main className="main-content">
                {currentView === 'feed' && (
                    <div className="feed-view">
                        <div className="view-header">
                            <h2>Reputation Activity</h2>
                            {isAuthenticated && (
                                <div className="action-buttons">
                                    <button 
                                        onClick={() => {
                                            const addresses = sampleUsers.slice(0, 3).map(u => u.address);
                                            setSelectedParticipants(addresses);
                                            handleScoringSubmit();
                                        }}
                                        className="primary-btn"
                                    >
                                        📝 Submit Reputation Scores
                                    </button>
                                </div>
                            )}
                        </div>
                        <ReputationFeed
                            actions={reputationActions}
                            profiles={profiles}
                            isWalletConnected={!!account}
                            isAuthenticated={isAuthenticated}
                            onEndorse={handleEndorse}
                            isProcessing={isCreatingSession || isSubmittingState}
                        />
                    </div>
                )}

                {currentView === 'profile' && (
                    <div className="profile-view">
                        {userProfile ? (
                            <div className="profile-content">
                                <div className="profile-header">
                                    <h2>{getDisplayName(userProfile.address)}</h2>
                                    <p className="profile-bio">{userProfile.bio || 'No bio available'}</p>
                                </div>
                                
                                <div className="profile-stats">
                                    <ReputationDisplay reputation={userProfile.reputation} />
                                </div>
                                
                                <div className="profile-badges">
                                    <h3>Achievements</h3>
                                    {userProfile.badges.length > 0 ? (
                                        <div className="badges-grid">
                                            {userProfile.badges.map(badge => (
                                                <div key={badge.id} className={`badge ${badge.earned ? 'earned' : 'locked'}`}>
                                                    <div className="badge-icon">{badge.icon}</div>
                                                    <div className="badge-name">{badge.name}</div>
                                                    <div className="badge-description">{badge.description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="no-badges">No badges earned yet</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="no-profile">
                                <h2>Profile Not Available</h2>
                                <p>Please connect your wallet to view your profile.</p>
                            </div>
                        )}
                    </div>
                )}

                {currentView === 'discover' && (
                    <div className="discover-view">
                        <h2>Discover Users</h2>
                        <div className="users-grid">
                            {sampleUsers.map(user => (
                                <div key={user.address} className="user-card">
                                    <h3>{getDisplayName(user.address)}</h3>
                                    <p className="user-bio">{user.bio}</p>
                                    <div className="user-reputation">
                                        <ReputationDisplay reputation={user.reputation} />
                                    </div>
                                    {isAuthenticated && account !== user.address && (
                                        <div className="user-actions">
                                            <button 
                                                onClick={() => handleEndorse(user.address, 'community', 5)}
                                                disabled={isCreatingSession || isSubmittingState}
                                                className="endorse-btn"
                                            >
                                                👍 Endorse
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {currentView === 'scoring' && (
                    <ReputationScoring
                        participants={selectedParticipants}
                        profiles={profiles}
                        sessionKey={sessionKey}
                        isAuthenticated={isAuthenticated}
                        currentUser={account}
                        category={scoringCategory}
                        onBack={() => setCurrentView('feed')}
                    />
                )}
            </main>

            {/* Footer */}
            <footer className="footer">
                <p>Global Reputation Platform - Building trust in the decentralized world</p>
            </footer>
        </div>
    );
}