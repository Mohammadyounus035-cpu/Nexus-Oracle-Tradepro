import { LATTICE_REGISTRY, DEGREES_PER_PATH, PATH_COUNT, guardianForPath } from '../src/lib/lattice/registry';
import { normalizeMarketDataPoint } from '../src/lib/marketData/normalizer';
import { SimulatedMarketDataProvider } from '../src/lib/marketData/providers/simulatedProvider';
import { mapMarketToLattice } from '../src/lib/lattice/marketMapper';
import { TradeEngine } from '../src/lib/tradeEngine';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export async function runTradePro96PathEngineTests(): Promise<void> {
  assert(PATH_COUNT === 96, 'registry must define 96 paths');
  assert(PATH_COUNT * DEGREES_PER_PATH === 360, '96 paths must cover 360 degrees');
  assert(LATTICE_REGISTRY.length === 96, 'lattice registry array length must be 96');
  assert(guardianForPath(1) === 'Lion', 'path 1 guardian');
  assert(guardianForPath(20) === 'Phoenix', 'path 20 guardian');
  assert(guardianForPath(39) === 'Dragon', 'path 39 guardian');
  assert(guardianForPath(58) === 'Owl', 'path 58 guardian');
  assert(guardianForPath(96) === 'Raven', 'path 96 guardian');

  const normalized = normalizeMarketDataPoint({
    symbol: ' aapl ',
    timestamp: '2026-01-01T00:00:00.000Z',
    open: 10000,
    high: 10100,
    low: 9900,
    close: 10050,
    volume: 1000,
  });
  assert(normalized.validation.ok, 'valid candle should normalize');
  assert(normalized.point.symbol === 'AAPL', 'symbol should uppercase');

  const providerA = new SimulatedMarketDataProvider(6176);
  const providerB = new SimulatedMarketDataProvider(6176);
  const range = {
    symbols: ['AAPL'],
    start: '2026-01-01T00:00:00.000Z',
    end: '2026-01-05T00:00:00.000Z',
    interval: '1d' as const,
  };
  const seriesA = await providerA.fetchRange(range);
  const seriesB = await providerB.fetchRange(range);
  assert(JSON.stringify(seriesA) === JSON.stringify(seriesB), 'simulated provider must replay deterministically');

  const lattice = mapMarketToLattice(seriesA);
  assert(lattice.path.index >= 1 && lattice.path.index <= 96, 'mapped lattice path should be inside registry');
  assert(lattice.path.active, 'mapper should avoid dormant paths by default');

  const engine = new TradeEngine();
  const order = engine.submitOrder({ symbol: 'AAPL', side: 'BUY', type: 'MARKET', qty: 5 });
  const fills = engine.processOrders('AAPL', 10000, () => 'test-proof');
  assert(order.status === 'FILLED', 'market order should fill on next tick');
  assert(fills.length === 1, 'one order should process');
  assert(fills[0]?.trade?.proof === 'test-proof', 'proof callback should be honored');
}

