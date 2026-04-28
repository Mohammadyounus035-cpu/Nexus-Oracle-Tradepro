/**
 * storage.ts — Session Persistence & Replay
 */

import { Portfolio, PortfolioManager } from './state';
import { Trade } from './engine';

export interface SessionSnapshot {
  version: string;
  timestamp: string;
  seed: number;
  portfolio: Portfolio;
}

const STORAGE_KEY = 'nexus_session_v4';

export function saveSession(snapshot: SessionSnapshot) {
  try {
    const serialized = JSON.stringify(snapshot, (key, value) => {
      if (value instanceof Map) {
        return {
          dataType: 'Map',
          value: Array.from(value.entries()),
        };
      }
      return value;
    });
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

export function loadSession(): SessionSnapshot | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored, (key, value) => {
      if (typeof value === 'object' && value !== null && value.dataType === 'Map') {
        return new Map(value.value);
      }
      return value;
    });
  } catch (e) {
    console.error('Failed to load session:', e);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
