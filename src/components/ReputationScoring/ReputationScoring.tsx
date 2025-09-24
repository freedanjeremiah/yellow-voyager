import { useState } from 'preact/hooks';
import { useReputationSubmission } from '../../hooks/useReputationSubmission';
import type { Address } from 'viem';
import type { UserProfile } from '../../types/reputation';
import type { SessionKey } from '../../lib/utils';
import styles from './ReputationScoring.module.css';

interface ReputationScoringProps {
    participants: Address[];
    profiles: Map<string, UserProfile>;
    sessionKey: SessionKey | null;
    isAuthenticated: boolean;
    currentUser: Address | null;
    category: string;
    onBack?: () => void;
}

export function ReputationScoring({ 
    participants, 
    profiles, 
    sessionKey, 
    isAuthenticated, 
    currentUser,
    category, 
    onBack 
}: ReputationScoringProps) {
    const [scores, setScores] = useState<Record<Address, { technical: number; community: number; trustworthiness: number; expertise: number }>>({});
    const [evidence, setEvidence] = useState<Record<Address, string>>({});
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { submitReputationScores } = useReputationSubmission(sessionKey, isAuthenticated, currentUser);

    const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
    
    const getUsername = (address: string) => {
        const profile = profiles.get(address);
        return profile?.username || formatAddress(address);
    };

    const updateScore = (participant: Address, scoreType: keyof typeof scores[Address], value: number) => {
        setScores(prev => ({
            ...prev,
            [participant]: {
                ...prev[participant] || { technical: 0, community: 0, trustworthiness: 0, expertise: 0 },
                [scoreType]: value
            }
        }));
    };

    const updateEvidence = (participant: Address, evidenceText: string) => {
        setEvidence(prev => ({
            ...prev,
            [participant]: evidenceText
        }));
    };

    const getOverallScore = (participantScores: { technical: number; community: number; trustworthiness: number; expertise: number }) => {
        return Math.round((participantScores.technical + participantScores.community + participantScores.trustworthiness + participantScores.expertise) / 4);
    };

    const hasValidScores = () => {
        return participants.some(participant => {
            const participantScores = scores[participant];
            return participantScores && Object.values(participantScores).some(score => score > 0);
        });
    };

    const handleSubmit = async () => {
        if (!hasValidScores()) {
            alert('Please provide at least one score for at least one participant');
            return;
        }

        setIsSubmitting(true);

        try {
            // Convert evidence to array format
            const evidenceArrays: Record<Address, string[]> = {};
            Object.entries(evidence).forEach(([address, text]) => {
                if (text.trim()) {
                    evidenceArrays[address as Address] = text.split(',').map(s => s.trim()).filter(Boolean);
                }
            });

            const result = await submitReputationScores(
                scores,
                category,
                Object.keys(evidenceArrays).length > 0 ? evidenceArrays : undefined,
                description || undefined
            );

            if (result.success) {
                alert(`Reputation scores submitted successfully! Session ID: ${result.sessionId}`);
                // Reset form
                setScores({});
                setEvidence({});
                setDescription('');
                if (onBack) onBack();
            } else {
                alert(`Failed to submit scores: ${result.error}`);
            }
        } catch (error) {
            alert(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        setIsSubmitting(false);
    };

    if (!isAuthenticated) {
        return (
            <div className={styles.notAuthenticated}>
                <h2>Authentication Required</h2>
                <p>Please connect your wallet and authenticate to submit reputation scores.</p>
                {onBack && <button onClick={onBack} className={styles.backButton}>Back</button>}
            </div>
        );
    }

    return (
        <div className={styles.scoringContainer}>
            <div className={styles.scoringHeader}>
                <div className={styles.headerTop}>
                    {onBack && <button onClick={onBack} className={styles.backButton}>← Back</button>}
                    <h2>Submit Reputation Scores</h2>
                </div>
                <p className={styles.category}>Category: <strong>{category}</strong></p>
                <p className={styles.participantCount}>{participants.length} participant{participants.length !== 1 ? 's' : ''}</p>
            </div>

            <div className={styles.descriptionSection}>
                <label className={styles.label}>
                    Session Description (optional):
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.currentTarget.value)}
                        placeholder="Describe the context for these reputation scores (e.g., 'Code review for project ABC', 'Workshop collaboration session')..."
                        rows={3}
                        className={styles.textarea}
                    />
                </label>
            </div>

            <div className={styles.participantsList}>
                {participants.map(participant => {
                    const participantScores = scores[participant] || { technical: 0, community: 0, trustworthiness: 0, expertise: 0 };
                    const profile = profiles.get(participant);
                    
                    return (
                        <div key={participant} className={styles.participantCard}>
                            <div className={styles.participantHeader}>
                                <div className={styles.participantInfo}>
                                    <h3>{getUsername(participant)}</h3>
                                    <span className={styles.participantAddress}>{participant}</span>
                                    {profile && (
                                        <div className={styles.currentReputation}>
                                            Current reputation: {profile.reputation.overall}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.overallScore}>
                                    <span className={styles.overallNumber}>{getOverallScore(participantScores)}</span>
                                    <span className={styles.overallLabel}>Overall</span>
                                </div>
                            </div>
                            
                            <div className={styles.scoreInputs}>
                                <div className={styles.scoreItem}>
                                    <label className={styles.scoreLabel}>
                                        <span className={styles.scoreIcon}>⚙️</span>
                                        Technical
                                    </label>
                                    <div className={styles.scoreControl}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={participantScores.technical}
                                            onChange={(e) => updateScore(participant, 'technical', Number(e.currentTarget.value))}
                                            className={styles.scoreSlider}
                                        />
                                        <span className={styles.scoreValue}>{participantScores.technical}</span>
                                    </div>
                                </div>

                                <div className={styles.scoreItem}>
                                    <label className={styles.scoreLabel}>
                                        <span className={styles.scoreIcon}>🤝</span>
                                        Community
                                    </label>
                                    <div className={styles.scoreControl}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={participantScores.community}
                                            onChange={(e) => updateScore(participant, 'community', Number(e.currentTarget.value))}
                                            className={styles.scoreSlider}
                                        />
                                        <span className={styles.scoreValue}>{participantScores.community}</span>
                                    </div>
                                </div>

                                <div className={styles.scoreItem}>
                                    <label className={styles.scoreLabel}>
                                        <span className={styles.scoreIcon}>🛡️</span>
                                        Trustworthiness
                                    </label>
                                    <div className={styles.scoreControl}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={participantScores.trustworthiness}
                                            onChange={(e) => updateScore(participant, 'trustworthiness', Number(e.currentTarget.value))}
                                            className={styles.scoreSlider}
                                        />
                                        <span className={styles.scoreValue}>{participantScores.trustworthiness}</span>
                                    </div>
                                </div>

                                <div className={styles.scoreItem}>
                                    <label className={styles.scoreLabel}>
                                        <span className={styles.scoreIcon}>🎯</span>
                                        Expertise
                                    </label>
                                    <div className={styles.scoreControl}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={participantScores.expertise}
                                            onChange={(e) => updateScore(participant, 'expertise', Number(e.currentTarget.value))}
                                            className={styles.scoreSlider}
                                        />
                                        <span className={styles.scoreValue}>{participantScores.expertise}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.evidenceSection}>
                                <label className={styles.label}>
                                    Evidence (comma-separated links):
                                    <input
                                        type="text"
                                        value={evidence[participant] || ''}
                                        onChange={(e) => updateEvidence(participant, e.currentTarget.value)}
                                        placeholder="https://github.com/user/repo, https://portfolio.com, ..."
                                        className={styles.evidenceInput}
                                    />
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.submitSection}>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !hasValidScores()}
                    className={styles.submitButton}
                >
                    {isSubmitting ? 'Submitting Scores...' : 'Submit Reputation Scores'}
                </button>
                <p className={styles.submitNote}>
                    This will create a permanent reputation record on the blockchain.
                </p>
            </div>
        </div>
    );
}