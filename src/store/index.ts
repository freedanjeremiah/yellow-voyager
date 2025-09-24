// Minimal store implementation for session management
import type { Address } from 'viem';

export interface WalletSigner {
  address: Address | null;
  isConnected: boolean;
  signMessage: (message: string) => Promise<string>;
  signTypedData: (domain: any, types: any, value: any) => Promise<string>;
}

export interface SettingsStore {
  rpcUrl: string;
  chainId: number;
  apiEndpoint: string;
}

export interface SessionState {
  sessionKey: any | null;
  currentUser: Address | null;
  isAuthenticated: boolean;
}

export interface NitroliteStore {
  wallet: WalletSigner | null;
  settings: SettingsStore;
  session: SessionState;
  updateSession: (session: Partial<SessionState>) => void;
  resetSession: () => void;
}

// Mock implementation for development
class MockWalletSigner implements WalletSigner {
  address: Address | null = null;
  isConnected = false;

  async signMessage(message: string): Promise<string> {
    console.log('Mock signing message:', message);
    return `mock_signature_${Date.now()}`;
  }

  async signTypedData(domain: any, types: any, value: any): Promise<string> {
    console.log('Mock signing typed data:', { domain, types, value });
    return `mock_typed_signature_${Date.now()}`;
  }
}

// Default store implementation
export const nitroliteStore: NitroliteStore = {
  wallet: new MockWalletSigner(),
  settings: {
    rpcUrl: 'https://mainnet.infura.io/v3/mock',
    chainId: 1,
    apiEndpoint: 'ws://localhost:8080'
  },
  session: {
    sessionKey: null,
    currentUser: null,
    isAuthenticated: false
  },
  updateSession: (session: Partial<SessionState>) => {
    Object.assign(nitroliteStore.session, session);
  },
  resetSession: () => {
    nitroliteStore.session = {
      sessionKey: null,
      currentUser: null,
      isAuthenticated: false
    };
  }
};

export default nitroliteStore;