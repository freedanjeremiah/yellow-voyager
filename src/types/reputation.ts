// Global reputation system types
import type { Address } from 'viem';

export interface ReputationScore {
  technical: number;
  community: number;
  trustworthiness: number;
  expertise: number;
  overall: number;
  lastUpdated: number;
  totalInteractions: number;
}

export interface ReputationAction {
  id: string;
  type: 'endorsement' | 'review' | 'collaboration' | 'achievement' | 'penalty';
  from: Address;
  to: Address;
  category: 'technical' | 'community' | 'trustworthiness' | 'expertise';
  score: number;
  evidence?: string[];
  description: string;
  timestamp: number;
  verified: boolean;
  sessionId: string;
}

export interface UserProfile {
  address: Address;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  reputation: ReputationScore;
  recentActions: ReputationAction[];
  badges: Badge[];
  endorsements: Endorsement[];
  joinedAt: number;
  isVerified: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  earned: boolean;
  earnedAt?: number;
  issuer: Address;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Endorsement {
  id: string;
  from: Address;
  to: Address;
  category: 'technical' | 'community' | 'trustworthiness' | 'expertise';
  message: string;
  score: number;
  timestamp: number;
  evidence?: string[];
}

// Session data structure for reputation submissions
export interface ReputationSessionData {
  sessionType: 'reputation_update';
  timestamp: number;
  reputationScores: {
    [participantAddress: string]: {
      technical: number;
      community: number;
      trustworthiness: number;
      expertise: number;
      overall: number;
    };
  };
  evidence?: {
    [participantAddress: string]: string[];
  };
  verificationMethod: 'peer_review' | 'automated' | 'oracle' | 'self_reported';
  category: string;
  description?: string;
  submittedBy: Address;
}

// WebSocket message types
export interface ReputationUpdateResponse {
  method: 'reputation_update';
  params: {
    action: ReputationAction;
    updatedProfile?: UserProfile;
  };
}

export interface ReputationProfileResponse {
  method: 'get_reputation_profile';
  params: {
    profile: UserProfile;
  };
}

export interface ReputationFeedResponse {
  method: 'reputation_feed';
  params: {
    actions: ReputationAction[];
    totalCount: number;
    page: number;
  };
}

// UI types
export type ViewType = 'feed' | 'profile' | 'discover';

// Hook result types
export interface ReputationSubmissionResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

// Component prop types
export interface ReputationDisplayProps {
  reputation: ReputationScore;
  isLoading?: boolean;
  showDetails?: boolean;
}

export interface ReputationFeedProps {
  actions: ReputationAction[];
  isLoading?: boolean;
  onEndorse?: (action: ReputationAction) => void;
  onViewProfile?: (address: Address) => void;
}

export interface ReputationScoringProps {
  participants: Address[];
  category: string;
  onSubmitScores?: (scores: Record<Address, ReputationScore>) => void;
  isSubmitting?: boolean;
}