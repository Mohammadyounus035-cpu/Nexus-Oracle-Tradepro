/**
 * tradepro.test.ts
 * Phase 4: Comprehensive integration test suite
 */

import { 
  MarketDataEngine, 
  MARKET_DATA_CONFIG 
} from './src/lib/engine';
import { 
  PortfolioManager 
} from './src/lib/state';
import { 
  RiskManager, 
  DEFAULT_RISK_CONFIG 
} from './src/lib/riskManager';
import { 
  AnalyticsEngine 
} from './src/lib/analyticsEngine';
import { 
  canonicalize, 
  canonicalHash 
} from './src/lib/integrity';

// Mock test harness for browser environment
async function runTests() {
  console.log('--- STARTING NEXUS ORACLE v4.0 INTEGRATION TESTS ---');

  const results = {
    passed: 0,
    failed: 0,
    list: [] as string[]
  };

  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      results.passed++;
      console.log(`[PASS] ${msg}`);
    } else {
      results.failed++;
      console.error(`[FAIL] ${msg}`);
      results.list.push(msg);
    }
  };

  try {
    // ═══════════════════════════════════════════════════════════
    // PHASE 1: Identity & Canonicalization
    // ═══════════════════════════════════════════════════════════
    const obj1 = { b: 2, a: 1, c: { d: 4, e: 3 } };
    const obj2 = { a: 1, c: { e: 3, d: 4 }, b: 2 };
    assert(canonicalize(obj1) === canonicalize(obj2), 'Canonicalization should be deterministic');
    
    const hash = await canonicalHash({ test: 'data' });
    assert(hash.length === 64, 'SHA-256 hash should be 64 characters');

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: Market Data & Portfolio
    // ═══════════════════════════════════════════════════════════
    const engine = new MarketDataEngine(12345);
    const quotes = engine.tick();
    assert(quotes.has('AAPL'), 'Market engine should tick AAPL');
    assert(quotes.get('AAPL')!.price > 0, 'AAPL price should be positive');

    const portfolio = new PortfolioManager(10000000);
    portfolio.updatePrices(quotes);
    assert(portfolio.getSnapshot().nav === 10000000, 'Initial NAV should match cash');

    // Execute trade
    const applePrice = quotes.get('AAPL')!.price;
    portfolio.executeTrade({
      id: 't1',
      orderId: 'o1',
      symbol: 'AAPL',
      side: 'BUY',
      qty: 100,
      price: applePrice,
      timestamp: new Date().toISOString(),
      proof: 'mock-proof'
    });

    const snap = portfolio.getSnapshot();
    assert(snap.positions.has('AAPL'), 'Portfolio should have AAPL position');
    assert(snap.cash === 10000000 - (100 * applePrice), 'Cash should be deducted');

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: Risk & Compliance
    // ═══════════════════════════════════════════════════════════
    const risk = new RiskManager(DEFAULT_RISK_CONFIG, 10000000);
    const metrics = risk.calculateMetrics(snap);
    assert(metrics.totalExposure > 0, 'Risk exposure should be tracked');
    
    const check = risk.checkOrder('AAPL', 'BUY', 1000000, applePrice, snap); // Huge order
    assert(check.status === 'warning', 'Large order should trigger risk warning');

    // ═══════════════════════════════════════════════════════════
    // PHASE 4: Analytics
    // ═══════════════════════════════════════════════════════════
    const analytics = new AnalyticsEngine();
    analytics.recordSnapshot(Date.now(), snap.cash, snap.positions);
    const perf = analytics.calculateMetrics(snap.tradeHistory);
    assert(perf.sharpeRatio !== undefined, 'Sharpe ratio should be calculated');

    console.log(`--- TEST SUMMARY: ${results.passed} PASSED, ${results.failed} FAILED ---`);
  } catch (e: any) {
    console.error('CRITICAL TEST ERROR:', e);
    results.failed++;
  }

  return results;
}

export default runTests;
