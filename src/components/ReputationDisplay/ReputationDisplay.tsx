import { type ReputationScore } from '../../types/reputation';
import styles from './ReputationDisplay.module.css';

interface ReputationDisplayProps {
    reputation: ReputationScore | null;
    isLoading?: boolean;
}

export function ReputationDisplay({ reputation, isLoading }: ReputationDisplayProps) {
    if (isLoading) {
        return (
            <div className={styles.reputationContainer}>
                <div className={styles.loading}>
                    <div className={styles.loadingSpinner}></div>
                    <span>Loading reputation...</span>
                </div>
            </div>
        );
    }

    if (!reputation) {
        return (
            <div className={styles.reputationContainer}>
                <div className={styles.noReputation}>
                    <span className={styles.reputationScore}>0</span>
                    <span className={styles.reputationLabel}>Reputation</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.reputationContainer}>
            <div className={styles.overallScore}>
                <span className={styles.reputationScore}>{reputation.overall}</span>
                <span className={styles.reputationLabel}>Reputation</span>
            </div>
            
            <div className={styles.categoryBreakdown}>
                <div className={styles.categoryItem}>
                    <span className={styles.categoryIcon}>⚙️</span>
                    <span className={styles.categoryScore}>{reputation.technical}</span>
                </div>
                <div className={styles.categoryItem}>
                    <span className={styles.categoryIcon}>🤝</span>
                    <span className={styles.categoryScore}>{reputation.community}</span>
                </div>
                <div className={styles.categoryItem}>
                    <span className={styles.categoryIcon}>🛡️</span>
                    <span className={styles.categoryScore}>{reputation.trustworthiness}</span>
                </div>
                <div className={styles.categoryItem}>
                    <span className={styles.categoryIcon}>🎯</span>
                    <span className={styles.categoryScore}>{reputation.expertise}</span>
                </div>
            </div>

            <div className={styles.reputationMeta}>
                <span className={styles.interactions}>
                    {reputation.totalInteractions} interactions
                </span>
                <span className={styles.lastUpdated}>
                    Updated {new Date(reputation.lastUpdated).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
}