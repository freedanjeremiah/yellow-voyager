// Global reputation system activity data
import type { ReputationAction } from '../types/reputation';
import type { Address } from 'viem';

// Sample reputation actions for demonstration
export const sampleReputationActions: ReputationAction[] = [
    {
        id: '1',
        type: 'endorsement',
        from: '0x742d35Cc6634C0532925a3b8D0b72242F5e82A4B' as Address,
        to: '0xE03faB973fA4f1E48fb89410ec70B7c49eBE97D3' as Address,
        category: 'technical',
        score: 15,
        evidence: [
            'https://github.com/alice/web3-project/pull/45',
            'https://docs.alice.dev/smart-contracts'
        ],
        description: 'Outstanding work on the new smart contract implementation. Clean code, comprehensive tests, and excellent documentation.',
        timestamp: Date.now() - 3600000, // 1 hour ago
        verified: true,
        sessionId: 'reputation_1703123456789_abc123'
    },
    {
        id: '2',
        type: 'review',
        from: '0x8ba1f109551bD432803012645Hac136c60143d3A' as Address,
        to: '0x742d35Cc6634C0532925a3b8D0b72242F5e82A4B' as Address,
        category: 'community',
        score: 12,
        evidence: [
            'https://discord.com/channels/web3/general/messages'
        ],
        description: 'Bob has been incredibly helpful in mentoring new developers in our Web3 community. Always patient and thorough in explanations.',
        timestamp: Date.now() - 7200000, // 2 hours ago
        verified: true,
        sessionId: 'reputation_1703120000000_def456'
    },
    {
        id: '3',
        type: 'collaboration',
        from: '0x1234567890123456789012345678901234567890' as Address,
        to: '0x8ba1f109551bD432803012645Hac136c60143d3A' as Address,
        category: 'trustworthiness',
        score: 18,
        evidence: [
            'https://github.com/security-audit/report-001',
            'https://medium.com/@diana/security-review-charlie'
        ],
        description: 'Collaborated on a critical security audit. Charlie demonstrated exceptional integrity and thoroughness throughout the process.',
        timestamp: Date.now() - 10800000, // 3 hours ago
        verified: true,
        sessionId: 'reputation_1703116800000_ghi789'
    },
    {
        id: '4',
        type: 'achievement',
        from: '0x0000000000000000000000000000000000000000' as Address, // System
        to: '0x1234567890123456789012345678901234567890' as Address,
        category: 'expertise',
        score: 25,
        evidence: [
            'https://audit-reports.com/diana-brown/portfolio',
            'https://certification.web3security.org/diana-brown'
        ],
        description: 'Achieved Web3 Security Expert certification after completing advanced security auditing course and finding 5 critical vulnerabilities.',
        timestamp: Date.now() - 14400000, // 4 hours ago
        verified: true,
        sessionId: 'reputation_1703113200000_jkl012'
    },
    {
        id: '5',
        type: 'endorsement',
        from: '0x9876543210987654321098765432109876543210' as Address,
        to: '0xabcdef1234567890abcdef1234567890abcdef12' as Address,
        category: 'community',
        score: 8,
        description: 'Frank has shown great enthusiasm in learning and asking thoughtful questions. A valuable addition to our community discussions.',
        timestamp: Date.now() - 18000000, // 5 hours ago
        verified: true,
        sessionId: 'reputation_1703109600000_mno345'
    },
    {
        id: '6',
        type: 'review',
        from: '0xE03faB973fA4f1E48fb89410ec70B7c49eBE97D3' as Address,
        to: '0x9876543210987654321098765432109876543210' as Address,
        category: 'technical',
        score: 14,
        evidence: [
            'https://github.com/eve/ui-components/pull/23',
            'https://figma.com/design/web3-ui-kit'
        ],
        description: 'Eve created beautiful and intuitive UI components for Web3 applications. The design system is comprehensive and well-documented.',
        timestamp: Date.now() - 21600000, // 6 hours ago
        verified: true,
        sessionId: 'reputation_1703106000000_pqr678'
    },
    {
        id: '7',
        type: 'collaboration',
        from: '0x742d35Cc6634C0532925a3b8D0b72242F5e82A4B' as Address,
        to: '0xE03faB973fA4f1E48fb89410ec70B7c49eBE97D3' as Address,
        category: 'expertise',
        score: 16,
        evidence: [
            'https://github.com/collaborative-project/final-report',
            'https://presentation.com/web3-scaling-solutions'
        ],
        description: 'Successful collaboration on a scaling solution research project. Alice brought deep technical insights and innovative approaches.',
        timestamp: Date.now() - 25200000, // 7 hours ago
        verified: true,
        sessionId: 'reputation_1703102400000_stu901'
    },
    {
        id: '8',
        type: 'penalty',
        from: '0x0000000000000000000000000000000000000000' as Address, // System
        to: '0xabcdef1234567890abcdef1234567890abcdef12' as Address,
        category: 'trustworthiness',
        score: -5,
        description: 'Minor penalty for missing a scheduled code review session without prior notice.',
        timestamp: Date.now() - 28800000, // 8 hours ago
        verified: true,
        sessionId: 'reputation_1703098800000_vwx234'
    },
    {
        id: '9',
        type: 'endorsement',
        from: '0x8ba1f109551bD432803012645Hac136c60143d3A' as Address,
        to: '0x742d35Cc6634C0532925a3b8D0b72242F5e82A4B' as Address,
        category: 'expertise',
        score: 20,
        evidence: [
            'https://blog.charlie.com/blockchain-architecture-review',
            'https://twitter.com/charlie_dev/thread/blockchain-patterns'
        ],
        description: 'Bob shared exceptional insights on blockchain architecture patterns. His expertise has helped shape our platform design decisions.',
        timestamp: Date.now() - 32400000, // 9 hours ago
        verified: true,
        sessionId: 'reputation_1703095200000_yzabc567'
    },
    {
        id: '10',
        type: 'achievement',
        from: '0x0000000000000000000000000000000000000000' as Address, // System
        to: '0x9876543210987654321098765432109876543210' as Address,
        category: 'technical',
        score: 12,
        evidence: [
            'https://portfolio.eve.design/web3-projects',
            'https://github.com/eve/accessibility-tools'
        ],
        description: 'Completed advanced Web3 UX/UI certification and created accessibility tools for decentralized applications.',
        timestamp: Date.now() - 36000000, // 10 hours ago
        verified: true,
        sessionId: 'reputation_1703091600000_defghi890'
    }
];

// Helper functions for reputation data
export function getRecentActions(limit: number = 20): ReputationAction[] {
    return sampleReputationActions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
}

export function getActionsByUser(userAddress: Address, limit: number = 10): ReputationAction[] {
    return sampleReputationActions
        .filter(action => action.to.toLowerCase() === userAddress.toLowerCase() || action.from.toLowerCase() === userAddress.toLowerCase())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
}

export function getActionsByCategory(category: 'technical' | 'community' | 'trustworthiness' | 'expertise', limit: number = 10): ReputationAction[] {
    return sampleReputationActions
        .filter(action => action.category === category)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
}
    },
    {
        id: '5',
        title: 'Web3 Developer Tools and Frameworks',
        content:
            "The right tools can significantly improve your Web3 development experience. Here's a comprehensive guide to the best frameworks and libraries.",
        authorId: '1',
        authorName: 'Alice Johnson',
        createdAt: '2025-01-11T11:30:00Z',
        type: 'Deep',
    },
    {
        id: '6',
        title: 'NFT Marketplace Development',
        content:
            'Building a comprehensive NFT marketplace requires careful consideration of user experience, smart contract design, and scalability.',
        authorId: '2',
        authorName: 'Bob Smith',
        createdAt: '2025-01-10T08:20:00Z',
        type: 'Deep',
    },
    {
        id: '7',
        title: 'Layer 2 Solutions and Scaling',
        content:
            'Understanding the various Layer 2 solutions available for Ethereum and how they can help scale decentralized applications.',
        authorId: '3',
        authorName: 'Charlie Davis',
        createdAt: '2025-01-09T13:45:00Z',
        type: 'Quick',
    },
    {
        id: '8',
        title: 'Cross-Chain Interoperability',
        content:
            'Exploring the future of blockchain interoperability and how different networks can communicate and share value.',
        authorId: '4',
        authorName: 'Diana Brown',
        createdAt: '2025-01-08T12:30:00Z',
        type: 'Deep',
    },
    {
        id: '9',
        title: 'Decentralized Storage Solutions',
        content:
            'From IPFS to Arweave, learn about the various decentralized storage options available for Web3 applications.',
        authorId: '1',
        authorName: 'Alice Johnson',
        createdAt: '2025-01-07T15:10:00Z',
        type: 'Quick',
    },
    {
        id: '10',
        title: 'Web3 Gaming and Metaverse',
        content:
            'The convergence of blockchain technology and gaming is creating new possibilities for player ownership and virtual economies.',
        authorId: '5',
        authorName: 'Eve Wilson',
        createdAt: '2025-01-06T11:25:00Z',
        type: 'Deep',
    },
    {
        id: '11',
        title: 'DAO Governance and Tokenomics',
        content:
            'Understanding the principles of decentralized autonomous organizations and how to design effective governance mechanisms.',
        authorId: '6',
        authorName: 'Frank Miller',
        createdAt: '2025-01-05T14:40:00Z',
        type: 'Quick',
    },
    {
        id: '12',
        title: 'Privacy-Preserving Technologies',
        content:
            'Zero-knowledge proofs and other privacy technologies are becoming essential for protecting user data in Web3.',
        authorId: '2',
        authorName: 'Bob Smith',
        createdAt: '2025-01-04T09:15:00Z',
        type: 'Deep',
    },
    {
        id: '13',
        title: 'Sustainable Blockchain Development',
        content:
            'Exploring eco-friendly blockchain solutions and the move towards more sustainable consensus mechanisms.',
        authorId: '3',
        authorName: 'Charlie Davis',
        createdAt: '2025-01-03T16:50:00Z',
        type: 'Quick',
    },
    {
        id: '14',
        title: 'Real-World Asset Tokenization',
        content:
            'The process of converting physical assets into digital tokens on the blockchain opens new investment opportunities.',
        authorId: '4',
        authorName: 'Diana Brown',
        createdAt: '2025-01-02T10:35:00Z',
        type: 'Deep',
    },
    {
        id: '15',
        title: 'Web3 Identity and Authentication',
        content:
            'Self-sovereign identity solutions are reshaping how users control and share their personal information online.',
        authorId: '1',
        authorName: 'Alice Johnson',
        createdAt: '2025-01-01T12:20:00Z',
        type: 'Quick',
    },
    {
        id: '16',
        title: 'Decentralized Social Networks',
        content:
            'The rise of decentralized social platforms promises to give users more control over their data and content.',
        authorId: '5',
        authorName: 'Eve Wilson',
        createdAt: '2024-12-31T14:45:00Z',
        type: 'Deep',
    },
    {
        id: '17',
        title: 'Blockchain Analytics and Monitoring',
        content:
            'Tools and techniques for monitoring blockchain networks and analyzing transaction patterns for insights.',
        authorId: '6',
        authorName: 'Frank Miller',
        createdAt: '2024-12-30T11:30:00Z',
        type: 'Quick',
    },
    {
        id: '18',
        title: 'Regulatory Compliance in Web3',
        content: 'Navigating the evolving regulatory landscape for cryptocurrency and blockchain-based applications.',
        authorId: '2',
        authorName: 'Bob Smith',
        createdAt: '2024-12-29T13:15:00Z',
        type: 'Deep',
    },
    {
        id: '19',
        title: 'Blockchain Security Best Practices',
        content:
            'A comprehensive guide to securing blockchain applications and protecting against common attack vectors.',
        authorId: '3',
        authorName: 'Charlie Davis',
        createdAt: '2024-12-28T15:20:00Z',
        type: 'Quick',
    },
    {
        id: '20',
        title: 'The Future of Decentralized Finance',
        content: 'Exploring emerging trends in DeFi, from yield farming to synthetic assets and beyond.',
        authorId: '4',
        authorName: 'Diana Brown',
        createdAt: '2024-12-27T09:40:00Z',
        type: 'Deep',
    },
];
