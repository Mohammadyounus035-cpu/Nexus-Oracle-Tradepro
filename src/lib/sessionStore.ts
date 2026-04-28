/**
 * sessionStore.ts — Persistence & Replay Manager
 * 
 * Handles LocalStorage persistence for portfolio snapshots,
 * identity metadata, and system configuration.
 */

import { PortfolioSnapshot } from './state';
import { SovereignIdentity } from './integrity';

const STORAGE_KEY = 'NEXUS_ORACLE_SESSION';

export interface SessionData {
  version: string;
  timestamp: string;
  identity: SovereignIdentity | null;
  portfolio: PortfolioSnapshot | null;
  settings: {
    theme: 'dark' | 'glass';
    simulationMode: boolean;
    heartbeatEnabled: boolean;
  };
}

export const sessionStore = {
  save(data: Partial<SessionData>): void {
    try {
      const existing = this.load() || {
        version: '4.0.0',
        timestamp: new Date().toISOString(),
        identity: null,
        portfolio: null,
        settings: { theme: 'dark', simulationMode: true, heartbeatEnabled: true }
      };
      
      const updated = { ...existing, ...data, timestamp: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Session persistence failed:', e);
    }
  },

  load(): SessionData | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Session recovery failed:', e);
      return null;
    }
  },

  purge(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('identity-db'); // Purge IDB identity if needed
  }
};
