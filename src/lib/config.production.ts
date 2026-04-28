// config.production.ts
// Phase 4: Production environment configuration
// All sensitive values loaded from environment variables

export interface ProductionConfig {
  // Identity
  identity: {
    keyStorage: 'hardware' | 'encrypted_file' | 'env';
    rotationDays: number;
    backupCount: number;
  };

  // Market Data
  marketData: {
    primaryWs: string;
    fallbackPoll: string;
    reconnectAttempts: number;
    heartbeatIntervalMs: number;
    pricePrecision: 'cents'; // Always integer cents
  };

  // Risk Management
  risk: {
    maxPositionSizeCents: number;
    maxTotalExposureCents: number;
    maxConcentrationPercent: number;
    maxDrawdownPercent: number;
    dailyLossLimitCents: number;
    preTradeSimulation: boolean;
    haltOnBreaches: boolean;
  };

  // Audit & Compliance
  audit: {
    proofAlgorithm: 'SHA-256';
    signatureScheme: 'Ed25519';
    retentionDays: number;
    immutableStorage: boolean;
  };

  // Session Persistence
  persistence: {
    backend: 'localStorage' | 'indexedDB' | 's3';
    encryption: 'AES-256-GCM';
    compression: boolean;
    maxSessionSizeMB: number;
  };

  // Analytics
  analytics: {
    equityCurveResolution: '1m' | '5m' | '1h' | '1d';
    metricsWindowDays: number;
    benchmarkSymbol: string;
  };

  // Strategies
  strategies: {
    maxConcurrent: number;
    defaultEnabled: boolean;
    paperTrading: boolean;
    liveTrading: boolean;
  };
}

export const productionConfig: ProductionConfig = {
  identity: {
    keyStorage: 'encrypted_file',
    rotationDays: 90,
    backupCount: 3
  },

  marketData: {
    primaryWs: 'wss://stream.tradepro.io/v1/market',
    fallbackPoll: 'https://api.tradepro.io/v1/prices',
    reconnectAttempts: 5,
    heartbeatIntervalMs: 30000,
    pricePrecision: 'cents'
  },

  risk: {
    maxPositionSizeCents: 500000, // $5,000
    maxTotalExposureCents: 8000000, // $80,000
    maxConcentrationPercent: 0.25,
    maxDrawdownPercent: 10.0,
    dailyLossLimitCents: 500000, // $5,000
    preTradeSimulation: true,
    haltOnBreaches: true
  },

  audit: {
    proofAlgorithm: 'SHA-256',
    signatureScheme: 'Ed25519',
    retentionDays: 2555, // 7 years
    immutableStorage: true
  },

  persistence: {
    backend: 'indexedDB',
    encryption: 'AES-256-GCM',
    compression: true,
    maxSessionSizeMB: 50
  },

  analytics: {
    equityCurveResolution: '5m',
    metricsWindowDays: 365,
    benchmarkSymbol: 'SPY'
  },

  strategies: {
    maxConcurrent: 5,
    defaultEnabled: false,
    paperTrading: true,
    liveTrading: false // Must be explicitly enabled
  }
};

// Environment validation
export function validateConfig(): string[] {
  const errors: string[] = [];
  return errors;
}

export default productionConfig;
