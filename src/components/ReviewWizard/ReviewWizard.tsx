import { useState, useEffect } from 'preact/hooks';

interface ReviewStep {
    id: number;
    title: string;
    description: string;
    isCompleted: boolean;
    isActive: boolean;
}

interface ReviewWizardProps {
    currentStep: number;
    stepsCompleted: boolean[];
    onStepChange: (step: number) => void;
    onStepComplete: (stepIndex: number) => void;
    isAuthenticated: boolean;
    participantB: string;
    amount: string;
    reputationType: string;
    reviewText: string;
    onParticipantBChange: (value: string) => void;
    onAmountChange: (value: string) => void;
    onReputationTypeChange: (value: string) => void;
    onReviewTextChange: (value: string) => void;
    onCreateSession: () => void;
    onGetSessions: () => void;
    onCloseSession: () => void;
    onSubmitReview: () => void;
    closeSessionId: string;
    onCloseSessionIdChange: (value: string) => void;
    createResult: string;
    getSessionsResult: string;
    closeResult: string;
    submitStateResult: string;
    appStateValue: string;
    onAppStateValueChange: (value: string) => void;
}

export function ReviewWizard(props: ReviewWizardProps) {
    const {
        currentStep,
        stepsCompleted,
        onStepChange,
        onStepComplete,
        isAuthenticated,
        participantB,
        amount,
        reputationType,
        reviewText,
        onParticipantBChange,
        onAmountChange,
        onReputationTypeChange,
        onReviewTextChange,
        onCreateSession,
        onGetSessions,
        onCloseSession,
        onSubmitReview,
        closeSessionId,
        onCloseSessionIdChange,
        createResult,
        getSessionsResult,
        closeResult,
        submitStateResult,
        appStateValue,
        onAppStateValueChange
    } = props;

    const steps: ReviewStep[] = [
        {
            id: 0,
            title: "Connect & Authenticate",
            description: "Connect your wallet and authenticate with Voyager to start reviewing",
            isCompleted: stepsCompleted[0],
            isActive: currentStep === 0
        },
        {
            id: 1,
            title: "Enter Reviewee Details",
            description: "Provide the address of the person or entity you want to review",
            isCompleted: stepsCompleted[1],
            isActive: currentStep === 1
        },
        {
            id: 2,
            title: "Set Review Parameters",
            description: "Choose the review type and set the reputation score (1-10)",
            isCompleted: stepsCompleted[2],
            isActive: currentStep === 2
        },
        {
            id: 3,
            title: "Write Your Review",
            description: "Add detailed feedback and comments about your experience",
            isCompleted: stepsCompleted[3],
            isActive: currentStep === 3
        },
        {
            id: 4,
            title: "Create & Submit Review",
            description: "Create the review session and submit your review to the network",
            isCompleted: stepsCompleted[4],
            isActive: currentStep === 4
        }
    ];

    const isStepValid = (stepIndex: number): boolean => {
        switch (stepIndex) {
            case 0: return isAuthenticated;
            case 1: return participantB.length > 0 && participantB.startsWith('0x');
            case 2: return amount.length > 0 && parseFloat(amount) >= 1 && parseFloat(amount) <= 10 && reputationType.length > 0;
            case 3: return reviewText.length > 10;
            case 4: return true;
            default: return false;
        }
    };

    const canProceedToNext = (stepIndex: number): boolean => {
        return isStepValid(stepIndex);
    };

    const goToStep = (stepIndex: number) => {
        if (stepIndex >= 0 && stepIndex < steps.length) {
            onStepChange(stepIndex);
        }
    };

    const goToNextStep = () => {
        if (currentStep < steps.length - 1 && canProceedToNext(currentStep)) {
            onStepComplete(currentStep);
            goToStep(currentStep + 1);
        }
    };

    const goToPreviousStep = () => {
        if (currentStep > 0) {
            goToStep(currentStep - 1);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="step-content">
                        <div className="step-info">
                            <h4>🔐 Authentication Required</h4>
                            <p>To create and submit reviews, you need to connect your wallet and authenticate with the Voyager network.</p>
                            {isAuthenticated ? (
                                <div className="success-message">
                                    ✅ Successfully authenticated! You can now proceed to the next step.
                                </div>
                            ) : (
                                <div className="info-message">
                                    ℹ️ Please connect your wallet using the "Connect Wallet" button in the header.
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 1:
                return (
                    <div className="step-content">
                        <div className="step-info">
                            <h4>👤 Who are you reviewing?</h4>
                            <p>Enter the Ethereum address of the person or entity you want to review.</p>
                        </div>
                        <div className="form-group">
                            <label htmlFor="reviewee-address">Reviewee Address</label>
                            <input
                                id="reviewee-address"
                                type="text"
                                placeholder="0x1234567890abcdef1234567890abcdef12345678"
                                value={participantB}
                                onInput={(e: any) => onParticipantBChange(e.currentTarget.value)}
                                className="full-width"
                            />
                            {participantB && !participantB.startsWith('0x') && (
                                <div className="error-message">
                                    ⚠️ Please enter a valid Ethereum address starting with 0x
                                </div>
                            )}
                            {participantB && participantB.startsWith('0x') && participantB.length === 42 && (
                                <div className="success-message">
                                    ✅ Valid Ethereum address entered
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="step-content">
                        <div className="step-info">
                            <h4>⭐ Set Review Parameters</h4>
                            <p>Choose the type of review and assign a reputation score from 1 to 10.</p>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="reputation-score">Reputation Score (1-10)</label>
                                <input
                                    id="reputation-score"
                                    type="number"
                                    min="1"
                                    max="10"
                                    step="0.1"
                                    placeholder="5.0"
                                    value={amount}
                                    onInput={(e: any) => onAmountChange(e.currentTarget.value)}
                                />
                                <small>Higher scores indicate better reputation</small>
                            </div>
                            <div className="form-group">
                                <label htmlFor="review-type">Review Category</label>
                                <select
                                    id="review-type"
                                    value={reputationType}
                                    onInput={(e: any) => onReputationTypeChange(e.currentTarget.value)}
                                >
                                    <option value="">Select category...</option>
                                    <option value="general">General</option>
                                    <option value="business">Business</option>
                                    <option value="technical">Technical</option>
                                    <option value="community">Community</option>
                                </select>
                            </div>
                        </div>
                        {amount && (parseFloat(amount) < 1 || parseFloat(amount) > 10) && (
                            <div className="error-message">
                                ⚠️ Please enter a score between 1 and 10
                            </div>
                        )}
                    </div>
                );

            case 3:
                return (
                    <div className="step-content">
                        <div className="step-info">
                            <h4>📝 Write Your Review</h4>
                            <p>Provide detailed feedback about your experience. This will help others make informed decisions.</p>
                        </div>
                        <div className="form-group">
                            <label htmlFor="review-text">Review Comments</label>
                            <textarea
                                id="review-text"
                                placeholder="Share your experience, what went well, areas for improvement, and any other relevant details..."
                                value={reviewText}
                                onInput={(e: any) => onReviewTextChange(e.currentTarget.value)}
                                className="review-textarea"
                                rows={6}
                            />
                            <div className="character-count">
                                {reviewText.length} characters {reviewText.length < 10 ? '(minimum 10 required)' : ''}
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="step-content">
                        <div className="step-info">
                            <h4>🚀 Create & Submit Review</h4>
                            <p>Review your information and submit it to the Voyager network.</p>
                        </div>
                        
                        <div className="review-summary">
                            <h5>Review Summary</h5>
                            <div className="summary-item">
                                <strong>Reviewee:</strong> {participantB}
                            </div>
                            <div className="summary-item">
                                <strong>Score:</strong> {amount}/10
                            </div>
                            <div className="summary-item">
                                <strong>Category:</strong> {reputationType}
                            </div>
                            <div className="summary-item">
                                <strong>Comments:</strong> {reviewText.substring(0, 100)}{reviewText.length > 100 ? '...' : ''}
                            </div>
                        </div>

                        <div className="action-buttons">
                            <button onClick={onCreateSession} disabled={!isAuthenticated} className="primary-button">
                                1. Create Review Session
                            </button>
                            <button onClick={onGetSessions} disabled={!isAuthenticated} className="secondary-button">
                                View Active Sessions
                            </button>
                        </div>

                        {createResult && (
                            <div className="result-section">
                                <h6>Session Creation Result:</h6>
                                <pre>{createResult}</pre>
                            </div>
                        )}

                        {getSessionsResult && (
                            <div className="result-section">
                                <h6>Active Sessions:</h6>
                                <pre>{getSessionsResult}</pre>
                            </div>
                        )}

                        {closeSessionId && (
                            <div className="session-actions">
                                <div className="form-group">
                                    <label htmlFor="session-id">Review Session ID</label>
                                    <input
                                        id="session-id"
                                        type="text"
                                        placeholder="Session ID from creation result"
                                        value={closeSessionId}
                                        onInput={(e: any) => onCloseSessionIdChange(e.currentTarget.value)}
                                        className="full-width"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="review-data">Review Data (JSON)</label>
                                    <textarea
                                        id="review-data"
                                        placeholder='{"reviewer": "address", "reviewee": "address", "score": 5, "category": "general", "comments": "..."}'
                                        value={appStateValue}
                                        onInput={(e: any) => onAppStateValueChange(e.currentTarget.value)}
                                        className="review-textarea"
                                        rows={4}
                                    />
                                </div>

                                <div className="action-buttons">
                                    <button onClick={onSubmitReview} disabled={!isAuthenticated || !closeSessionId} className="primary-button">
                                        2. Submit Review
                                    </button>
                                    <button onClick={onCloseSession} disabled={!isAuthenticated} className="secondary-button">
                                        3. Close Session
                                    </button>
                                </div>
                            </div>
                        )}

                        {submitStateResult && (
                            <div className="result-section">
                                <h6>Review Submission Result:</h6>
                                <pre>{submitStateResult}</pre>
                            </div>
                        )}

                        {closeResult && (
                            <div className="result-section">
                                <h6>Session Close Result:</h6>
                                <pre>{closeResult}</pre>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="review-wizard">
            <div className="wizard-header">
                <h3>Review Creation Wizard</h3>
                <p>Follow these steps to create and submit a reputation review</p>
            </div>

            <div className="progress-bar">
                <div className="progress-track">
                    <div 
                        className="progress-fill" 
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    ></div>
                </div>
                <div className="progress-text">
                    Step {currentStep + 1} of {steps.length}
                </div>
            </div>

            <div className="steps-navigation">
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={`step-indicator ${step.isActive ? 'active' : ''} ${step.isCompleted ? 'completed' : ''}`}
                        onClick={() => goToStep(index)}
                    >
                        <div className="step-number">
                            {step.isCompleted ? '✓' : index + 1}
                        </div>
                        <div className="step-details">
                            <div className="step-title">{step.title}</div>
                            <div className="step-description">{step.description}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="wizard-content">
                {renderStepContent()}
            </div>

            <div className="wizard-navigation">
                <button 
                    onClick={goToPreviousStep} 
                    disabled={currentStep === 0}
                    className="nav-button secondary"
                >
                    ← Previous
                </button>
                
                <div className="step-status">
                    {canProceedToNext(currentStep) ? (
                        <span className="status-ready">✓ Ready to proceed</span>
                    ) : (
                        <span className="status-incomplete">Complete this step to continue</span>
                    )}
                </div>

                <button 
                    onClick={goToNextStep} 
                    disabled={currentStep === steps.length - 1 || !canProceedToNext(currentStep)}
                    className="nav-button primary"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
