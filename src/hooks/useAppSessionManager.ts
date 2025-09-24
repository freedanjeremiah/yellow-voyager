// Reputation app session management
import { useCallback, useState } from 'preact/hooks';
import { 
  createAppSessionMessage, 
  createCloseAppSessionMessage,
  createSubmitAppStateMessage 
} from '@erc7824/nitrolite';
import type { Address } from 'viem';
import { webSocketService } from '../lib/websocket';
import type { SessionKey } from '../lib/utils';
import type { ReputationSessionData } from '../types/reputation';

interface AppSessionInfo {
  appSessionId: string;
  participants: Address[];
  serverAddress: Address;
  createdAt: number;
  status: 'active' | 'closed' | 'error';
}

export interface ReputationSessionResult {
  success: boolean;
  error?: string;
  appSessionId?: string;
}

export const useAppSessionManager = (sessionKey: SessionKey | null, isAuthenticated: boolean, currentUser: Address | null) => {
  const [activeSessions, setActiveSessions] = useState<Map<string, AppSessionInfo>>(new Map());
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSubmittingState, setIsSubmittingState] = useState(false);

  // Create an app session for reputation scoring
  const createReputationSession = useCallback(
    async (participants: Address[], sessionType: string = 'reputation_scoring'): Promise<ReputationSessionResult> => {
      if (!isAuthenticated || !sessionKey || !currentUser) {
        return { success: false, error: 'Please authenticate first' };
      }

      setIsCreatingSession(true);

      try {
        // Server address (in a real app, this would come from config)
        const serverAddress = currentUser; // For now, use current user as server
        
        // Create app definition for reputation session
        const appDefinition = {
          protocol: "reputation_nitrolite_v1",
          participants: [currentUser, ...participants, serverAddress],
          weights: [10, ...participants.map(() => 10), 70], // Server has higher weight
          quorum: 80,
          challenge: 0,
          nonce: Date.now(),
        };

        // Create allocations (start with 0 for all participants)
        const allocations = [
          {
            participant: currentUser,
            asset: 'reputation_points',
            amount: '0',
          },
          ...participants.map(participant => ({
            participant,
            asset: 'reputation_points',
            amount: '0',
          })),
          {
            participant: serverAddress,
            asset: 'reputation_points',
            amount: '0',
          },
        ];

        // Use session key to sign the message
        const signMessage = async (message: any) => {
          // In a real implementation, this would use the session key to sign
          return JSON.stringify({
            req: [1, "create_app_session", {
              definition: appDefinition,
              allocations
            }, Date.now()],
            sig: ["signature_placeholder"] // Would be actual signature
          });
        };

        // Create the signed app session message
        const signedMessage = await createAppSessionMessage(
          signMessage,
          [{
            definition: appDefinition,
            allocations
          }]
        );

        // Set up promise to handle WebSocket response
        const sessionResponsePromise = new Promise<any>((resolve, reject) => {
          const handleSessionResponse = (data: any) => {
            try {
              const message = typeof data === 'string' ? JSON.parse(data) : data;
              
              // Check for app session creation response
              if (message.res && (message.res[1] === 'create_app_session' || message.res[1] === 'app_session_created')) {
                webSocketService.removeMessageListener(handleSessionResponse);
                resolve(message.res[2]);
              }
              
              // Handle errors
              if (message.err) {
                webSocketService.removeMessageListener(handleSessionResponse);
                reject(new Error(`Session creation error: ${message.err[2]}`));
              }
            } catch (error) {
              console.error('Error parsing session response:', error);
            }
          };

          webSocketService.addMessageListener(handleSessionResponse);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            webSocketService.removeMessageListener(handleSessionResponse);
            reject(new Error('Session creation timeout'));
          }, 10000);
        });

        // Send the message
        console.log('Creating reputation app session...');
        webSocketService.send(signedMessage);

        // Wait for response
        const response = await sessionResponsePromise;
        const appSessionId = response?.app_session_id || response?.[0]?.app_session_id || `reputation_${Date.now()}`;

        // Store session info
        const sessionInfo: AppSessionInfo = {
          appSessionId,
          participants: [currentUser, ...participants],
          serverAddress,
          createdAt: Date.now(),
          status: 'active'
        };

        setActiveSessions(prev => new Map(prev.set(appSessionId, sessionInfo)));

        console.log(`Created reputation session: ${appSessionId}`);
        return { success: true, appSessionId };

      } catch (error) {
        console.error('Failed to create reputation session:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to create session' 
        };
      } finally {
        setIsCreatingSession(false);
      }
    },
    [sessionKey, isAuthenticated, currentUser]
  );

  // Submit reputation state to an existing session
  const submitReputationState = useCallback(
    async (
      appSessionId: string,
      reputationData: ReputationSessionData,
      allocations: Array<{ participant: Address; asset: string; amount: string }>
    ): Promise<ReputationSessionResult> => {
      if (!isAuthenticated || !sessionKey || !currentUser) {
        return { success: false, error: 'Please authenticate first' };
      }

      const session = activeSessions.get(appSessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      setIsSubmittingState(true);

      try {
        // Create sign function using session key
        const signMessage = async (message: any) => {
          return JSON.stringify({
            req: [1, "submit_app_state", {
              app_session_id: appSessionId,
              allocations,
              session_data: JSON.stringify(reputationData)
            }, Date.now()],
            sig: ["signature_placeholder"] // Would be actual signature
          });
        };

        // Create the signed message
        const signedMessage = await createSubmitAppStateMessage(
          signMessage,
          {
            app_session_id: appSessionId,
            allocations,
            session_data: JSON.stringify(reputationData)
          }
        );

        // Set up response handler
        const stateResponsePromise = new Promise<any>((resolve, reject) => {
          const handleStateResponse = (data: any) => {
            try {
              const message = typeof data === 'string' ? JSON.parse(data) : data;
              
              if (message.res && message.res[1] === 'submit_app_state') {
                webSocketService.removeMessageListener(handleStateResponse);
                resolve(message.res[2]);
              }
              
              if (message.err) {
                webSocketService.removeMessageListener(handleStateResponse);
                reject(new Error(`State submission error: ${message.err[2]}`));
              }
            } catch (error) {
              console.error('Error parsing state response:', error);
            }
          };

          webSocketService.addMessageListener(handleStateResponse);
          
          setTimeout(() => {
            webSocketService.removeMessageListener(handleStateResponse);
            reject(new Error('State submission timeout'));
          }, 10000);
        });

        // Send the message
        console.log(`Submitting reputation state to session: ${appSessionId}`);
        webSocketService.send(signedMessage);

        // Wait for response
        await stateResponsePromise;

        console.log(`Successfully submitted reputation state to session: ${appSessionId}`);
        return { success: true, appSessionId };

      } catch (error) {
        console.error('Failed to submit reputation state:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to submit state' 
        };
      } finally {
        setIsSubmittingState(false);
      }
    },
    [sessionKey, isAuthenticated, currentUser, activeSessions]
  );

  // Close a reputation session
  const closeReputationSession = useCallback(
    async (
      appSessionId: string,
      finalAllocations: Array<{ participant: Address; asset: string; amount: string }>
    ): Promise<ReputationSessionResult> => {
      if (!isAuthenticated || !sessionKey || !currentUser) {
        return { success: false, error: 'Please authenticate first' };
      }

      const session = activeSessions.get(appSessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      try {
        // Create sign function
        const signMessage = async (message: any) => {
          return JSON.stringify({
            req: [1, "close_app_session", {
              app_session_id: appSessionId,
              allocations: finalAllocations
            }, Date.now()],
            sig: ["signature_placeholder"]
          });
        };

        // Create close message
        const signedMessage = await createCloseAppSessionMessage(
          signMessage,
          [{
            app_session_id: appSessionId,
            allocations: finalAllocations
          }],
          finalAllocations
        );

        // Send close message
        webSocketService.send(signedMessage);

        // Update session status
        setActiveSessions(prev => {
          const updated = new Map(prev);
          const sessionInfo = updated.get(appSessionId);
          if (sessionInfo) {
            updated.set(appSessionId, { ...sessionInfo, status: 'closed' });
          }
          return updated;
        });

        console.log(`Closed reputation session: ${appSessionId}`);
        return { success: true, appSessionId };

      } catch (error) {
        console.error('Failed to close session:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to close session' 
        };
      }
    },
    [sessionKey, isAuthenticated, currentUser, activeSessions]
  );

  // Get session info
  const getSessionInfo = useCallback((appSessionId: string) => {
    return activeSessions.get(appSessionId) || null;
  }, [activeSessions]);

  // Get all active sessions
  const getActiveSessions = useCallback(() => {
    return Array.from(activeSessions.values()).filter(session => session.status === 'active');
  }, [activeSessions]);

  return {
    createReputationSession,
    submitReputationState,
    closeReputationSession,
    getSessionInfo,
    getActiveSessions,
    isCreatingSession,
    isSubmittingState,
    activeSessions: Array.from(activeSessions.values())
  };
};