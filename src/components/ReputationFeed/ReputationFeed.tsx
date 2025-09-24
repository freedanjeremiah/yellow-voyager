import { type ReputationAction, type UserProfile } from '../../types/reputation';
import styles from './ReputationFeed.module.css';

interface ReputationFeedProps {
    actions: ReputationAction[];
    profiles: Map<string, UserProfile>;
    isWalletConnected: boolean;
    isAuthenticated: boolean;
    onEndorse?: (recipient: string, category: 'technical' | 'community' | 'trustworthiness' | 'expertise', score: number) => Promise<void>;
    isProcessing?: boolean;
}

export function ReputationFeed({ 
    actions, 
    profiles, 
    isWalletConnected, 
    isAuthenticated, 
    onEndorse, 
    isProcessing 
}: ReputationFeedProps) {
    
    const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
    
    const getUsername = (address: string) => {
        const profile = profiles.get(address);
        return profile?.username || formatAddress(address);
    };

    const getActionIcon = (type: string) => {
        switch (type) {
            case 'endorsement': return '👍';
            case 'review': return '📝';
            case 'collaboration': return '🤝';
            case 'achievement': return '🏆';
            case 'penalty': return '⚠️';
            default: return '📊';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'technical': return '#0066cc';
            case 'community': return '#00cc66';
            case 'trustworthiness': return '#cc6600';
            case 'expertise': return '#6600cc';
            default: return '#666666';
        }
    };

    const handleEndorse = async (action: ReputationAction) => {
        if (!onEndorse) {
            console.log('Endorse function not available');
            return;
        }

        console.log(`Endorsing ${getUsername(action.to)} in ${action.category}`);
        await onEndorse(action.to, action.category, 1);
    };

    if (actions.length === 0) {
        return (
            <div className={styles.emptyState}>
                <h3>No reputation activity yet</h3>
                <p>Reputation actions will appear here as they happen.</p>
                {!isWalletConnected && (
                    <p>Connect your wallet to participate in the reputation network.</p>
                )}
            </div>
        );
    }

    return (
        <div className={styles.feedContainer}>
            <div className={styles.feedHeader}>
                <h2>Reputation Activity Feed</h2>
                <p>Real-time reputation updates from the global network</p>
            </div>
            
            <div className={styles.actionsList}>
                {actions.map(action => (
                    <article key={action.id} className={styles.actionCard}>
                        <div className={styles.actionHeader}>
                            <div className={styles.actionIcon}>
                                {getActionIcon(action.type)}
                            </div>
                            <div className={styles.actionInfo}>
                                <div className={styles.actionUsers}>
                                    <span className={styles.fromUser}>
                                        {getUsername(action.from)}
                                    </span>
                                    <span className={styles.actionText}>
                                        {action.type === 'endorsement' ? 'endorsed' :
                                         action.type === 'review' ? 'reviewed' :
                                         action.type === 'collaboration' ? 'collaborated with' :
                                         action.type === 'achievement' ? 'awarded achievement to' :
                                         'updated reputation for'}
                                    </span>
                                    <span className={styles.toUser}>
                                        {getUsername(action.to)}
                                    </span>
                                </div>
                                <div className={styles.actionMeta}>
                                    <span 
                                        className={styles.category}
                                        style={{ backgroundColor: getCategoryColor(action.category) }}
                                    >
                                        {action.category}
                                    </span>
                                    <span className={styles.score}>
                                        {action.score > 0 ? '+' : ''}{action.score}
                                    </span>
                                    <span className={styles.timestamp}>
                                        {new Date(action.timestamp).toLocaleString()}
                                    </span>
                                    {action.verified && (
                                        <span className={styles.verified} title="Verified Action">
                                            ✅
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {action.description && (
                            <div className={styles.actionDescription}>
                                <p>{action.description}</p>
                            </div>
                        )}

                        {action.evidence && action.evidence.length > 0 && (
                            <div className={styles.actionEvidence}>
                                <h4>Evidence:</h4>
                                <div className={styles.evidenceLinks}>
                                    {action.evidence.map((link, index) => (
                                        <a 
                                            key={index}
                                            href={link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className={styles.evidenceLink}
                                        >
                                            📎 Evidence {index + 1}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isAuthenticated && onEndorse && action.from !== action.to && (
                            <div className={styles.actionButtons}>
                                <button
                                    onClick={() => handleEndorse(action)}
                                    disabled={isProcessing}
                                    className={styles.endorseButton}
                                    title="Endorse this reputation update"
                                >
                                    {isProcessing ? 'Processing...' : '👍 Endorse (+1)'}
                                </button>
                            </div>
                        )}
                    </article>
                ))}
            </div>
        </div>
    );
}