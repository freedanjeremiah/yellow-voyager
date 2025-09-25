# Voyager - Global Reputation System

**Voyager is a global reputation system—powered by Yellow SDK and Nitrolite Protocol—that creates a unified reputation layer that's secure, interoperable, and privacy-preserving. Users earn verifiable reputation tokens through activity, peer endorsements, and stake-weighted metrics.**

## 🌟 Project Overview

Voyager leverages the power of state channels through `@erc7824/nitrolite` to create a high-throughput, low-latency reputation platform. This enables instant reputation scoring and peer review capabilities with on-chain security guarantees, delivering a Web2-like user experience while maintaining Web3 decentralization principles.

### Key Features

- **Instant Reputation Reviews**: Create and submit reputation reviews with zero-latency using state channels
- **Multi-Party Sessions**: Secure session management for reviewer-reviewee interactions
- **Real-time Updates**: WebSocket-based live updates for reputation scores and reviews
- **EIP-712 Authentication**: Secure wallet-based authentication without gas fees
- **Interoperable Design**: Built on Yellow SDK for cross-chain compatibility

## 🛠 Technology Stack

- **Framework:** Preact with Hooks
- **Language:** TypeScript  
- **Build Tool:** Vite
- **Styling:** Modern CSS with glassmorphism effects
- **State Channels:** `@erc7824/nitrolite` v0.3.0
- **Web3 Integration:** Viem for wallet connectivity
- **Real-time:** WebSocket communication

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- MetaMask or compatible Web3 wallet
- Access to Yellow Network WebSocket endpoint

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/freedanjeremiah/yellow-voyager.git
   cd yellow-voyager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create `.env.local` in the project root:
   ```env
   VITE_NITROLITE_WS_URL=wss://clearnet.yellow.com/ws
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

## 📊 Live Demo & Session Details

### Primary Wallet Address
**`0x50e7677f41070098B062c6270fC325aC6A43F698`**
- Contains channel creation and session management
- Used for demonstration and testing purposes

### Active Session Address  
**`0x46ec05f3a2fcae3404f128d2e7450089f07d615ebc343e05b582c69c4f6f47fc`**

🔗 **Monitor Live Sessions:** [https://ynscan.xyz/sessions](https://ynscan.xyz/sessions)

## 🌿 Branch Structure

### Main Branches

- **`reputation`** (current): Full reputation system implementation with step-by-step review UI
- **`playground`**: Complete functional branch demonstrating all core actions:
  - Session creation and management
  - Session closure workflows  
  - Application state management
  - Real-time reputation scoring

### Development Branches

- **`main`**: Initial project foundation
- **`chapter-1-wallet-connect`**: Wallet integration implementation
- **`chapter-2-ws-connection`**: WebSocket connectivity setup
- **`chapter-3-session-auth`**: EIP-712 authentication system
- **`chapter-4-display-balances`**: Balance fetching and display

## 🔧 Related Repositories

### Hooks Improvement
**[checks-unstable](https://github.com/freedanjeremiah/checks-unstable)** - Advanced hooks and utilities repository focused on improving the core session management and state handling capabilities of the Voyager reputation system.

## 💡 Core Features Demonstration

### 1. Reputation Review Process
- **Step 1**: Connect wallet and authenticate via EIP-712
- **Step 2**: Enter reviewee address (0x...)  
- **Step 3**: Set reputation parameters (score 1-10, review type)
- **Step 4**: Write detailed review comments
- **Step 5**: Create session and submit review instantly

### 2. Session Management
- Create multi-party reputation sessions
- Real-time session state synchronization  
- Secure session closure with finalization
- Channel-based communication for scalability

### 3. Real-time Updates
- Live WebSocket connection status
- Instant balance and reputation updates
- Real-time session participant notifications
- Live reputation score calculations

## 🏗 Architecture

```
Voyager Reputation Platform
├── Frontend (Preact + TypeScript)
├── State Channels (Nitrolite Protocol)
├── Authentication (EIP-712 Signatures) 
├── Real-time Communication (WebSocket)
└── Yellow SDK Integration
```

### Key Components

- **Session Manager**: Handles multi-party reputation sessions
- **Authentication System**: EIP-712 based secure login
- **Review Wizard**: Step-by-step reputation review interface
- **Real-time Engine**: WebSocket-based live updates
- **Reputation Calculator**: Stake-weighted scoring algorithms

## 🔐 Security Features

- **Zero Gas Authentication**: EIP-712 signatures for gasless login
- **State Channel Security**: On-chain dispute resolution capabilities  
- **Privacy Preservation**: Selective disclosure of reputation data
- **Verifiable Reviews**: Cryptographic proof of review authenticity

## 📈 Reputation Metrics

Users earn reputation through:
- **Direct Reviews**: Peer-to-peer reputation scoring (1-10)
- **Activity Metrics**: Platform engagement and participation
- **Stake Weighting**: Reputation value based on staked tokens
- **Cross-chain Recognition**: Interoperable reputation across networks

## 🌐 Network Integration

- **Primary Network**: Yellow Network
- **Session Explorer**: ynscan.xyz for live session monitoring
- **WebSocket Endpoint**: wss://clearnet.yellow.com/ws
- **Cross-chain Support**: Via Yellow SDK compatibility layer

---

**Built with 💛 by the Yellow Network ecosystem**
