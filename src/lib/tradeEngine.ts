/**
 * tradeEngine.ts - Event-driven TradePro execution engine.
 *
 * The public API remains compatible with the dashboard while adding the
 * phase-1/phase-2 market data and 96-path lattice execution contract.
 */

import { Order, OrderSide, OrderType, Trade } from './engine';
import { canonicalize } from './integrity';
import { evaluateLatticeGuards } from './lattice/guards';
import { mapMarketToLattice } from './lattice/marketMapper';
import { MarketLatticeState } from './lattice/types';
import { MarketDataPoint } from './marketData/types';
import { normalizeMarketDataPoint } from './marketData/normalizer';
import { MarketHistoryStore } from './marketData/historyStore';
import { RiskDecision } from './riskManager';

export type OrderRejectReason =
  | 'INVALID_QTY'
  | 'INVALID_SYMBOL'
  | 'LIMIT_PRICE_REQUIRED'
  | 'STOP_PRICE_REQUIRED'
  | 'STOP_LIMIT_PRICES_REQUIRED'
  | 'RISK_BLOCKED'
  | 'NO_MARKET_DATA'
  | 'DORMANT_PATH_BLOCKED';

export interface OrderEvent {
  timestamp: string;
  type: 'submitted' | 'triggered' | 'filled' | 'partial' | 'cancelled' | 'rejected';
  shares?: number;
  price?: number;
  message?: string;
}

export interface EnhancedOrder extends Order {
  filled: number;
  remaining: number;
  avgFillPrice: number;
  events: OrderEvent[];
  rejectReason?: OrderRejectReason;
  triggered?: boolean;
}

export interface LiquiditySnapshot {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  maxExecutableQty: number;
  timestamp: string;
}

export interface ExecutionContext {
  quote: MarketDataPoint;
  lattice: MarketLatticeState;
  risk: RiskDecision;
  liquidity: LiquiditySnapshot;
  now: string;
}

export interface ExecutionResult {
  order: EnhancedOrder;
  trades: Trade[];
  lattice: MarketLatticeState;
  accepted: boolean;
  reason?: OrderRejectReason;
}

export interface TradeProofPayload {
  order: EnhancedOrder;
  quote: MarketDataPoint;
  lattice: MarketLatticeState;
  risk: RiskDecision;
  liquidity: LiquiditySnapshot;
  trades: Omit<Trade, 'proof'>[];
}

type EngineEventMap = {
  orderSubmitted: EnhancedOrder;
  orderTriggered: EnhancedOrder;
  orderFilled: EnhancedOrder;
  orderPartial: EnhancedOrder;
  orderCancelled: EnhancedOrder;
  orderRejected: { order: EnhancedOrder; reason: OrderRejectReason };
  tradeExecuted: { order: EnhancedOrder; trade: Trade; context: ExecutionContext };
  priceUpdate: MarketDataPoint;
  bookUpdate: LiquiditySnapshot;
};

export type EngineEvent = {
  [K in keyof EngineEventMap]: {
    type: K;
    timestamp: string;
    data: EngineEventMap[K];
  }
}[keyof EngineEventMap];

type EventCallback = (event: EngineEvent) => void;
type ProofGenerator = (payload: TradeProofPayload | Trade) => string;
type RiskEvaluator = (order: EnhancedOrder, context: Omit<ExecutionContext, 'risk'>) => RiskDecision;

const DEFAULT_RISK_DECISION: RiskDecision = {
  status: 'allow',
  checks: [{ id: 'default-risk', status: 'pass', message: 'No external risk manager configured' }],
  maxExecutableQty: Number.MAX_SAFE_INTEGER,
};

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on<K extends keyof EngineEventMap>(eventType: K, callback: (event: Extract<EngineEvent, { type: K }>) => void): () => void;
  on(eventType: string, callback: EventCallback): () => void;
  on(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    const listeners = this.listeners.get(eventType);
    if (!listeners) return () => undefined;
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  emit(event: EngineEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (!callbacks) return;
    callbacks.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    });
  }
}

export const engineEvents = new EventBus();

export class TradeEngine {
  private orders: Map<string, EnhancedOrder> = new Map();
  private marketHistory = new MarketHistoryStore(7560);
  private orderIdCounter = 0;
  private tradeIdCounter = 0;
  private riskEvaluator?: RiskEvaluator;

  generateOrderId(): string {
    this.orderIdCounter += 1;
    return `ord-${Date.now()}-${this.orderIdCounter}`;
  }

  setRiskEvaluator(evaluator: RiskEvaluator): void {
    this.riskEvaluator = evaluator;
  }

  submitOrder(params: {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    qty: number;
    price?: number;
    stopPrice?: number;
  }): EnhancedOrder {
    const timestamp = new Date().toISOString();
    const order = this.createOrder(params, timestamp);
    const rejectReason = this.validateOrder(order);

    if (rejectReason) {
      order.status = 'REJECTED';
      order.rejectReason = rejectReason;
      order.events.push({
        timestamp,
        type: 'rejected',
        message: rejectReason,
      });
      this.emit('orderRejected', { order, reason: rejectReason });
      return order;
    }

    this.orders.set(order.id, order);
    this.emit('orderSubmitted', order);
    return order;
  }

  processOrders(
    symbol: string,
    currentPrice: number,
    generateProof: ProofGenerator = (payload) => deterministicProof(payload)
  ): Array<{ order: EnhancedOrder; trade?: Trade }> {
    const quote = this.quoteFromPrice(symbol, currentPrice);
    this.marketHistory.append(quote);
    this.emit('priceUpdate', quote);

    const history = this.marketHistory.get(quote.symbol, 252);
    const lattice = mapMarketToLattice(history.length > 0 ? history : [quote]);
    const liquidity = this.estimateLiquidity(quote, history);
    this.emit('bookUpdate', liquidity);

    const results: Array<{ order: EnhancedOrder; trade?: Trade }> = [];

    for (const order of this.orders.values()) {
      if (order.symbol !== quote.symbol) continue;
      if (order.status === 'FILLED' || order.status === 'CANCELLED' || order.status === 'REJECTED') continue;

      const guard = evaluateLatticeGuards(lattice);
      if (guard.status === 'block') {
        this.rejectActiveOrder(order, 'DORMANT_PATH_BLOCKED');
        results.push({ order });
        continue;
      }

      if (!this.isFillable(order, quote.close)) continue;

      const risk = this.evaluateRisk(order, { quote, lattice, liquidity, now: quote.timestamp });
      const context: ExecutionContext = {
        quote,
        lattice,
        liquidity,
        risk,
        now: quote.timestamp,
      };

      if (risk.status === 'block') {
        this.rejectActiveOrder(order, 'RISK_BLOCKED');
        results.push({ order });
        continue;
      }

      const executableQty = Math.min(order.remaining, liquidity.maxExecutableQty, risk.maxExecutableQty);
      if (executableQty <= 0) {
        results.push({ order });
        continue;
      }

      const trade = this.executeFill(order, quote.close, executableQty, context, generateProof);
      results.push({ order, trade });
    }

    return results;
  }

  cancelOrder(orderId: string): boolean {
    const order = this.orders.get(orderId);
    if (!order || order.status === 'FILLED' || order.status === 'CANCELLED' || order.status === 'REJECTED') {
      return false;
    }

    order.status = 'CANCELLED';
    order.events.push({
      timestamp: new Date().toISOString(),
      type: 'cancelled',
      message: `Cancelled with ${order.remaining} remaining`,
    });

    this.emit('orderCancelled', order);
    return true;
  }

  on<K extends keyof EngineEventMap>(eventType: K, callback: (event: Extract<EngineEvent, { type: K }>) => void): () => void;
  on(eventType: string, callback: EventCallback): () => void;
  on(eventType: string, callback: EventCallback): () => void {
    return engineEvents.on(eventType, callback);
  }

  getOrders(symbol?: string): EnhancedOrder[] {
    const orders = Array.from(this.orders.values());
    return symbol ? orders.filter((order) => order.symbol === symbol.toUpperCase()) : orders;
  }

  ingestMarketData(point: MarketDataPoint): MarketLatticeState {
    this.marketHistory.append(point);
    this.emit('priceUpdate', point);
    return mapMarketToLattice(this.marketHistory.get(point.symbol, 252));
  }

  private createOrder(
    params: {
      symbol: string;
      side: OrderSide;
      type: OrderType;
      qty: number;
      price?: number;
      stopPrice?: number;
    },
    timestamp: string
  ): EnhancedOrder {
    return {
      id: this.generateOrderId(),
      symbol: params.symbol.trim().toUpperCase(),
      side: params.side,
      type: params.type,
      qty: params.qty,
      ...(params.price !== undefined ? { limitPrice: params.price } : {}),
      ...(params.stopPrice !== undefined ? { stopPrice: params.stopPrice } : {}),
      filled: 0,
      remaining: params.qty,
      avgFillPrice: 0,
      timestamp,
      status: 'PENDING',
      events: [{
        timestamp,
        type: 'submitted',
        message: `${params.type} ${params.side} ${params.qty} ${params.symbol.trim().toUpperCase()}`,
      }],
    };
  }

  private validateOrder(order: EnhancedOrder): OrderRejectReason | undefined {
    if (!/^[A-Z0-9._-]{1,20}$/.test(order.symbol)) return 'INVALID_SYMBOL';
    if (!Number.isFinite(order.qty) || order.qty <= 0) return 'INVALID_QTY';
    if (order.type === 'LIMIT' && (!order.limitPrice || order.limitPrice <= 0)) return 'LIMIT_PRICE_REQUIRED';
    if (order.type === 'STOP' && (!order.stopPrice || order.stopPrice <= 0)) return 'STOP_PRICE_REQUIRED';
    if (order.type === 'STOP_LIMIT' && (!order.stopPrice || !order.limitPrice || order.stopPrice <= 0 || order.limitPrice <= 0)) {
      return 'STOP_LIMIT_PRICES_REQUIRED';
    }
    return undefined;
  }

  private quoteFromPrice(symbol: string, price: number): MarketDataPoint {
    const normalized = normalizeMarketDataPoint({
      symbol,
      timestamp: new Date(),
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 1000,
      source: 'trade-engine-price-tick',
      mode: 'SIMULATED',
    });
    if (!normalized.validation.ok) {
      throw new Error(normalized.validation.issues.map((issue) => issue.code).join(', '));
    }
    return normalized.point;
  }

  private estimateLiquidity(quote: MarketDataPoint, history: MarketDataPoint[]): LiquiditySnapshot {
    const averageVolume = history.length === 0
      ? quote.volume
      : history.reduce((sum, point) => sum + point.volume, 0) / history.length;
    const maxExecutableQty = Math.max(1, Math.floor(Math.max(quote.volume, averageVolume) * 0.1));
    const spread = Math.max(1, Math.round(quote.close * 0.001));

    return {
      symbol: quote.symbol,
      bid: quote.close - spread,
      ask: quote.close + spread,
      spread: spread * 2,
      maxExecutableQty,
      timestamp: quote.timestamp,
    };
  }

  private isFillable(order: EnhancedOrder, price: number): boolean {
    if (order.type === 'MARKET') return true;

    if (order.type === 'LIMIT') {
      return order.side === 'BUY'
        ? price <= (order.limitPrice ?? 0)
        : price >= (order.limitPrice ?? Number.MAX_SAFE_INTEGER);
    }

    if (order.type === 'STOP') {
      const triggered = order.side === 'BUY'
        ? price >= (order.stopPrice ?? Number.MAX_SAFE_INTEGER)
        : price <= (order.stopPrice ?? 0);
      if (triggered) this.markTriggered(order, price);
      return triggered;
    }

    const stopTriggered = order.triggered || (order.side === 'BUY'
      ? price >= (order.stopPrice ?? Number.MAX_SAFE_INTEGER)
      : price <= (order.stopPrice ?? 0));

    if (!stopTriggered) return false;
    this.markTriggered(order, price);
    return order.side === 'BUY'
      ? price <= (order.limitPrice ?? 0)
      : price >= (order.limitPrice ?? Number.MAX_SAFE_INTEGER);
  }

  private markTriggered(order: EnhancedOrder, price: number): void {
    if (order.triggered) return;
    order.triggered = true;
    order.events.push({
      timestamp: new Date().toISOString(),
      type: 'triggered',
      price,
      message: `Stop triggered at ${(price / 100).toFixed(2)}`,
    });
    this.emit('orderTriggered', order);
  }

  private evaluateRisk(
    order: EnhancedOrder,
    context: Omit<ExecutionContext, 'risk'>
  ): RiskDecision {
    if (!this.riskEvaluator) {
      return {
        ...DEFAULT_RISK_DECISION,
        maxExecutableQty: order.remaining,
      };
    }
    return this.riskEvaluator(order, context);
  }

  private executeFill(
    order: EnhancedOrder,
    price: number,
    shares: number,
    context: ExecutionContext,
    generateProof: ProofGenerator
  ): Trade {
    const fillShares = Math.min(Math.max(0, Math.floor(shares)), order.remaining);
    const total = price * fillShares;
    const previousFilled = order.filled;

    order.filled += fillShares;
    order.remaining -= fillShares;

    const prevTotal = order.avgFillPrice * previousFilled;
    order.avgFillPrice = order.filled === 0 ? 0 : Math.round((prevTotal + total) / order.filled);
    order.status = order.remaining === 0 ? 'FILLED' : 'PARTIAL';

    const event: OrderEvent = {
      timestamp: context.now,
      type: order.status === 'FILLED' ? 'filled' : 'partial',
      shares: fillShares,
      price,
      message: `${order.status === 'FILLED' ? 'Filled' : 'Partial fill'} ${fillShares} @ ${(price / 100).toFixed(2)}`,
    };
    order.events.push(event);

    const tradeWithoutProof: Omit<Trade, 'proof'> = {
      id: this.generateTradeId(order),
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      qty: fillShares,
      price,
      timestamp: context.now,
    };

    const proofPayload: TradeProofPayload = {
      order,
      quote: context.quote,
      lattice: context.lattice,
      risk: context.risk,
      liquidity: context.liquidity,
      trades: [tradeWithoutProof],
    };

    const trade: Trade = {
      ...tradeWithoutProof,
      proof: generateProof(proofPayload),
    };

    this.emit(order.status === 'FILLED' ? 'orderFilled' : 'orderPartial', order);
    this.emit('tradeExecuted', { order, trade, context });
    return trade;
  }

  private rejectActiveOrder(order: EnhancedOrder, reason: OrderRejectReason): void {
    order.status = 'REJECTED';
    order.rejectReason = reason;
    order.events.push({
      timestamp: new Date().toISOString(),
      type: 'rejected',
      message: reason,
    });
    this.emit('orderRejected', { order, reason });
  }

  private generateTradeId(order: EnhancedOrder): string {
    this.tradeIdCounter += 1;
    return `trd-${order.id}-${this.tradeIdCounter}`;
  }

  private emit<K extends keyof EngineEventMap>(type: K, data: EngineEventMap[K]): void {
    engineEvents.emit({
      type,
      timestamp: new Date().toISOString(),
      data,
    } as EngineEvent);
  }
}

function deterministicProof(payload: unknown): string {
  const canonical = canonicalize(payload);
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index++) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export const tradeEngine = new TradeEngine();
