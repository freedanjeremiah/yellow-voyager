// Comprehensive session manager hook for reputation platform
import { useState, useCallback } from 'preact/hooks';
import type { Address } from 'viem';
import type { SessionKey } from '../lib/utils';
import type { ReputationSessionData } from '../types/reputation';

// Import individual session hooks
import { createAppSession, type CreateAppSessionParams, type CreateAppSessionResult } from './create_app_session';
import { closeAppSession, type CloseAppSessionParams, type CloseAppSessionResult } from './close_app_session';
import { getAppSessionInfo, type GetAppSessionInfoResult } from './get_app_session_info';
import { submitAppState, type SubmitAppStateParams, type SubmitAppStateResult } from './useAppState';

export interface ReputationSessionManager {
    // Session management
    createReputationSession: (participants: Address[], category: string) => Promise<CreateAppSessionResult>;
    submitReputationState: (sessionId: string, reputationData: ReputationSessionData, allocations?: any[]) => Promise<SubmitAppStateResult>;
    closeReputationSession: (sessionId: string, finalAllocations: any[]) => Promise<CloseAppSessionResult>;
    getReputationSessions: (participant?: Address) => Promise<GetAppSessionInfoResult>;
    
    // State tracking
    isCreatingSession: boolean;
    isSubmittingState: boolean;
    isClosingSession: boolean;
    isLoadingSessions: boolean;
    
    // Current session
    currentSessionId: string | null;
    setCurrentSessionId: (id: string | null) => void;
}

export const useAppSessionManager = (
    sessionKey: SessionKey | null,
    isAuthenticated: boolean,
    currentUser: Address | null
): ReputationSessionManager => {
    
    // State tracking
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [isSubmittingState, setIsSubmittingState] = useState(false);
    const [isClosingSession, setIsClosingSession] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    const createReputationSession = useCallback(
        async (participants: Address[], category: string): Promise<CreateAppSessionResult> => {
            if (!sessionKey || !isAuthenticated || !currentUser) {
                return { success: false, error: 'Not authenticated' };
            }

            setIsCreatingSession(true);
            try {
                // Ensure current user is included in participants
                const allParticipants = [currentUser, ...participants.filter(p => p !== currentUser)];
                
                const params: CreateAppSessionParams = {
                    participants: allParticipants,
                    protocol: 'reputation_nitrolite_v1',
                    quorum: Math.max(60, Math.floor(80 * allParticipants.length / (allParticipants.length + 1))),
                    allocations: allParticipants.map(participant => ({
                        participant,
                        asset: 'reputation_points',
                        amount: '0' // Initial allocation, will be updated when submitting state
                    }))
                };

                const result = await createAppSession(params, sessionKey, currentUser);
                
                if (result.success && result.appSessionId) {
                    setCurrentSessionId(result.appSessionId);
                    console.log(`Created reputation session: ${result.appSessionId} for category: ${category}`);
                }
                
                return result;
                
            } catch (error) {
                console.error('Failed to create reputation session:', error);
                return { 
                    success: false, 
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            } finally {
                setIsCreatingSession(false);
            }
        },
        [sessionKey, isAuthenticated, currentUser]
    );

    const submitReputationState = useCallback(
        async (
            sessionId: string, 
            reputationData: ReputationSessionData, 
            allocations?: any[]
        ): Promise<SubmitAppStateResult> => {
            if (!sessionKey || !isAuthenticated) {
                return { success: false, error: 'Not authenticated' };
            }

            setIsSubmittingState(true);
            try {
                const params: SubmitAppStateParams = {
                    appSessionId: sessionId,
                    sessionData: reputationData,
                    allocations: allocations || [] // Optional allocations
                };

                const result = await submitAppState(params, sessionKey);
                
                if (result.success) {
                    console.log(`Submitted reputation state for session: ${sessionId}`);
                }
                
                return result;
                
            } catch (error) {
                console.error('Failed to submit reputation state:', error);
                return { 
                    success: false, 
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            } finally {
                setIsSubmittingState(false);
            }
        },
        [sessionKey, isAuthenticated]
    );

    const closeReputationSession = useCallback(
        async (sessionId: string, finalAllocations: any[]): Promise<CloseAppSessionResult> => {
            if (!sessionKey || !isAuthenticated) {
                return { success: false, error: 'Not authenticated' };
            }

            setIsClosingSession(true);
            try {
                const params: CloseAppSessionParams = {
                    appSessionId: sessionId,
                    finalAllocations
                };

                const result = await closeAppSession(params, sessionKey);
                
                if (result.success) {
                    console.log(`Closed reputation session: ${sessionId}`);
                    if (currentSessionId === sessionId) {
                        setCurrentSessionId(null);
                    }
                }
                
                return result;
                
            } catch (error) {
                console.error('Failed to close reputation session:', error);
                return { 
                    success: false, 
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            } finally {
                setIsClosingSession(false);
            }
        },
        [sessionKey, isAuthenticated, currentSessionId]
    );

    const getReputationSessions = useCallback(
        async (participant?: Address): Promise<GetAppSessionInfoResult> => {
            if (!sessionKey || !isAuthenticated || !currentUser) {
                return { success: false, error: 'Not authenticated' };
            }

            setIsLoadingSessions(true);
            try {
                const result = await getAppSessionInfo(sessionKey, currentUser, participant);
                
                if (result.success) {
                    console.log(`Retrieved ${result.sessions?.length || 0} sessions`);
                }
                
                return result;
                
            } catch (error) {
                console.error('Failed to get reputation sessions:', error);
                return { 
                    success: false, 
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            } finally {
                setIsLoadingSessions(false);
            }
        },
        [sessionKey, isAuthenticated, currentUser]
    );

    return {
        createReputationSession,
        submitReputationState,
        closeReputationSession,
        getReputationSessions,
        isCreatingSession,
        isSubmittingState,
        isClosingSession,
        isLoadingSessions,
        currentSessionId,
        setCurrentSessionId
    };
};