// Global reputation system user data
import type { UserProfile } from '../types/reputation';
import type { Address } from 'viem';

// Sample reputation data for demonstration
export const sampleUsers: UserProfile[] = [
    {
        address: '0xE03faB973fA4f1E48fb89410ec70B7c49eBE97D3' as Address,
        username: 'Alice Johnson',
        bio: 'Full-stack developer specializing in Web3 and DeFi protocols. Active contributor to open source projects.',
        avatarUrl: undefined,
        reputation: {
            technical: 85,
            community: 92,
            trustworthiness: 88,
            expertise: 90,
            overall: 89,
            lastUpdated: Date.now() - 86400000, // 1 day ago
            totalInteractions: 156
        },
        recentActions: [],
        badges: [
            {
                id: 'early_adopter',
                name: 'Early Adopter',
                description: 'One of the first 100 users on the platform',
                icon: '🚀',
                criteria: 'Join within the first month',
                earned: true,
                earnedAt: Date.now() - 7776000000, // 3 months ago
                issuer: '0x0000000000000000000000000000000000000000' as Address,
                rarity: 'rare'
            },
            {
                id: 'code_reviewer',
                name: 'Code Reviewer',
                description: 'Completed 50+ code reviews',
                icon: '👨‍💻',
                criteria: 'Complete 50 code reviews',
                earned: true,
                earnedAt: Date.now() - 2592000000, // 1 month ago
                issuer: '0x0000000000000000000000000000000000000000' as Address,
                rarity: 'common'
            }
        ],
        endorsements: [],
        joinedAt: Date.now() - 7776000000, // 3 months ago
        isVerified: true
    },
    {
        address: '0x742d35Cc6634C0532925a3b8D0b72242F5e82A4B' as Address,
        username: 'Bob Smith',
        bio: 'Blockchain architect with 5+ years experience. Building the future of decentralized systems.',
        reputation: {
            technical: 94,
            community: 76,
            trustworthiness: 95,
            expertise: 91,
            overall: 89,
            lastUpdated: Date.now() - 3600000, // 1 hour ago
            totalInteractions: 203
        },
        recentActions: [],
        badges: [
            {
                id: 'expert_contributor',
                name: 'Expert Contributor',
                description: 'Recognized as a subject matter expert',
                icon: '🏆',
                criteria: 'Receive 100+ technical endorsements',
                earned: true,
                earnedAt: Date.now() - 1296000000, // 2 weeks ago
                issuer: '0x0000000000000000000000000000000000000000' as Address,
                rarity: 'epic'
            }
        ],
        endorsements: [],
        joinedAt: Date.now() - 15552000000, // 6 months ago
        isVerified: true
    },
    {
        address: '0x8ba1f109551bD432803012645Hac136c60143d3A' as Address,
        username: 'Charlie Davis',
        bio: 'Community manager and Web3 educator. Passionate about making blockchain accessible to everyone.',
        reputation: {
            technical: 72,
            community: 96,
            trustworthiness: 90,
            expertise: 85,
            overall: 86,
            lastUpdated: Date.now() - 7200000, // 2 hours ago
            totalInteractions: 342
        },
        recentActions: [],
        badges: [
            {
                id: 'community_leader',
                name: 'Community Leader',
                description: 'Outstanding community contributions',
                icon: '🌟',
                criteria: 'Lead 10+ community initiatives',
                earned: true,
                earnedAt: Date.now() - 604800000, // 1 week ago
                issuer: '0x0000000000000000000000000000000000000000' as Address,
                rarity: 'rare'
            }
        ],
        endorsements: [],
        joinedAt: Date.now() - 10368000000, // 4 months ago
        isVerified: true
    },
    {
        address: '0x1234567890123456789012345678901234567890' as Address,
        username: 'Diana Brown',
        bio: 'Smart contract auditor and security researcher. Helping make DeFi safer for everyone.',
        reputation: {
            technical: 98,
            community: 74,
            trustworthiness: 99,
            expertise: 95,
            overall: 92,
            lastUpdated: Date.now() - 1800000, // 30 minutes ago
            totalInteractions: 89
        },
        recentActions: [],
        badges: [
            {
                id: 'security_expert',
                name: 'Security Expert',
                description: 'Found and reported critical vulnerabilities',
                icon: '🛡️',
                criteria: 'Report 5+ critical security issues',
                earned: true,
                earnedAt: Date.now() - 2592000000, // 1 month ago
                issuer: '0x0000000000000000000000000000000000000000' as Address,
                rarity: 'legendary'
            }
        ],
        endorsements: [],
        joinedAt: Date.now() - 5184000000, // 2 months ago
        isVerified: true
    },
    {
        address: '0x9876543210987654321098765432109876543210' as Address,
        username: 'Eve Wilson',
        bio: 'Frontend developer and UX designer focused on creating intuitive Web3 experiences.',
        reputation: {
            technical: 81,
            community: 88,
            trustworthiness: 85,
            expertise: 79,
            overall: 83,
            lastUpdated: Date.now() - 10800000, // 3 hours ago
            totalInteractions: 127
        },
        recentActions: [],
        badges: [
            {
                id: 'design_pioneer',
                name: 'Design Pioneer',
                description: 'Creating beautiful and accessible Web3 interfaces',
                icon: '🎨',
                criteria: 'Design 10+ user-friendly Web3 interfaces',
                earned: true,
                earnedAt: Date.now() - 1209600000, // 2 weeks ago
                issuer: '0x0000000000000000000000000000000000000000' as Address,
                rarity: 'rare'
            }
        ],
        endorsements: [],
        joinedAt: Date.now() - 6480000000, // 2.5 months ago
        isVerified: false
    },
    {
        address: '0xabcdef1234567890abcdef1234567890abcdef12' as Address,
        username: 'Frank Miller',
        bio: 'New to the Web3 space but eager to learn and contribute to the ecosystem.',
        reputation: {
            technical: 45,
            community: 68,
            trustworthiness: 72,
            expertise: 38,
            overall: 56,
            lastUpdated: Date.now() - 14400000, // 4 hours ago
            totalInteractions: 23
        },
        recentActions: [],
        badges: [
            {
                id: 'newcomer',
                name: 'Newcomer',
                description: 'Welcome to the reputation network!',
                icon: '👋',
                criteria: 'Complete profile setup',
                earned: true,
                earnedAt: Date.now() - 1296000000, // 2 weeks ago
                issuer: '0x0000000000000000000000000000000000000000' as Address,
                rarity: 'common'
            }
        ],
        endorsements: [],
        joinedAt: Date.now() - 1296000000, // 2 weeks ago
        isVerified: false
    }
];

// Helper function to get user by address
export function getUserByAddress(address: Address): UserProfile | undefined {
    return sampleUsers.find(user => user.address.toLowerCase() === address.toLowerCase());
}

// Helper function to get multiple users by addresses
export function getUsersByAddresses(addresses: Address[]): UserProfile[] {
    return addresses.map(address => getUserByAddress(address)).filter(Boolean) as UserProfile[];
}
