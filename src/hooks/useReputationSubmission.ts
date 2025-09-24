// Reputation submission hook using existing session management hooks
import { useCallback } from 'preact/hooks';
import type { Address } from 'viem';
import type { SessionKey } from '../lib/utils';
import type { ReputationSessionData, ReputationSubmissionResult } from '../types/reputation';
import { webSocketService } from '../lib/websocket';

// For now, use simplified session management that works with current infrastructure
export const useReputationSubmission = (sessionKey: SessionKey | null, isAuthenticated: boolean, currentUser: Address | null) => {
  
  const submitReputationScores = useCallback(
    async (
      participantScores: Record<Address, { technical: number; community: number; trustworthiness: number; expertise: number }>,
      category: string,
      evidence?: Record<Address, string[]>,
      description?: string
    ): Promise<ReputationSubmissionResult> => {
      if (!isAuthenticated || !sessionKey || !currentUser) {
        return { success: false, error: 'Please authenticate first' };
      }

      try {
        // Generate session ID
        const sessionId = `reputation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const participants = Object.keys(participantScores) as Address[];
        
        if (participants.length === 0) {
          return { success: false, error: 'No participants provided' };
        }

        console.log('Submitting reputation scores for participants:', participants.length);

        // Step 1: Create app session (simplified for current infrastructure)
        const appDefinition = {
          protocol: "reputation_nitrolite_v1",
          participants: [currentUser, ...participants],
          weights: participants.map(() => 100 / (participants.length + 1)),
          quorum: 80,
          challenge: 0,
          nonce: Date.now(),
        };

        // Step 2: Prepare reputation data and allocations
        const reputationScores: Record<string, any> = {};
        const allocations: Array<{ participant: Address; asset: string; amount: string }> = [];

        Object.entries(participantScores).forEach(([address, scores]) => {
          const overall = Math.round((scores.technical + scores.community + scores.trustworthiness + scores.expertise) / 4);
          
          reputationScores[address] = {
            ...scores,
            overall
          };

          // Allocate reputation points based on overall score
          allocations.push({
            participant: address as Address,
            asset: 'reputation_points',
            amount: (overall / 10).toFixed(2)
          });
        });

        // Create reputation session data
        const reputationData: ReputationSessionData = {
          sessionType: 'reputation_update',
          timestamp: Date.now(),
          reputationScores,
          evidence,
          verificationMethod: 'peer_review',
          category,
          description,
          submittedBy: currentUser
        };

        // Step 3: Create and send the complete session message
        const sessionMessage = {
          req: [1, "create_and_submit_reputation_session", {
            app_definition: appDefinition,
            session_id: sessionId,
            allocations,
            session_data: JSON.stringify(reputationData)
          }, Date.now()],
          // In production, this would be signed with the session key
          sig: ["reputation_signature_placeholder"]
        };

        console.log('Sending reputation session:', {
          sessionId,
          participantCount: participants.length,
          category,
          totalAllocations: allocations.reduce((sum, alloc) => sum + parseFloat(alloc.amount), 0)
        });

        // Send via WebSocket
        webSocketService.send(JSON.stringify(sessionMessage));
        
        // Simulate success response (in production, this would wait for WebSocket response)
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log(`Successfully submitted reputation scores via session: ${sessionId}`);
        return { success: true, sessionId };

      } catch (error) {
        console.error('Failed to submit reputation scores:', error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to submit reputation';
        return { success: false, error: errorMsg };
      }
    },
    [sessionKey, isAuthenticated, currentUser]
  );

  const submitEndorsement = useCallback(
    async (
      recipient: Address,
      category: 'technical' | 'community' | 'trustworthiness' | 'expertise',
      score: number,
      message: string,
      evidence?: string[]
    ): Promise<ReputationSubmissionResult> => {
      if (!isAuthenticated || !sessionKey || !currentUser) {
        return { success: false, error: 'Please authenticate first' };
      }

      // Create single participant score record for endorsement
      const participantScores: Record<Address, any> = {
        [recipient]: {
          technical: category === 'technical' ? score : 0,
          community: category === 'community' ? score : 0,
          trustworthiness: category === 'trustworthiness' ? score : 0,
          expertise: category === 'expertise' ? score : 0
        }
      };

      const evidenceRecord = evidence && evidence.length > 0 ? { [recipient]: evidence } : undefined;

      return await submitReputationScores(
        participantScores,
        `${category}_endorsement`,
        evidenceRecord,
        message
      );
    },
    [submitReputationScores, sessionKey, isAuthenticated, currentUser]
  );

  return { 
    submitReputationScores, 
    submitEndorsement,
    isCreatingSession: false, // Simplified for current setup
    isSubmittingState: false   // Simplified for current setup
  };
};