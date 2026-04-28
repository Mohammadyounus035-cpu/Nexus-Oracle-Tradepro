/**
 * orderBook.ts — Price-Time Priority Order Book
 *
 * Maintains bid/ask levels with aggregate depth.
 * Provides market depth visualization data.
 */

export interface BookLevel {
  price: number;        // cents
  size: number;         // total shares at this price
  orderCount: number;   // number of orders
}

export interface OrderBook {
  symbol: string;
  bids: BookLevel[];    // Sorted descending (highest bid first)
  asks: BookLevel[];    // Sorted ascending (lowest ask first)
  spread: number;       // cents
  midPrice: number;     // cents
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Order Book Engine
// ---------------------------------------------------------------------------

interface InternalOrder {
  id: string;
  price: number;
  shares: number;
  side: 'BUY' | 'SELL';
  timestamp: number;    // For time priority
}

export class OrderBookEngine {
  private bids: Map<number, InternalOrder[]> = new Map();  // price -> orders
  private asks: Map<number, InternalOrder[]> = new Map();  // price -> orders
  private orders: Map<string, InternalOrder> = new Map();
  private seqNum = 0;

  addOrder(id: string, side: 'BUY' | 'SELL', price: number, shares: number): void {
    const order: InternalOrder = { id, price, shares, side, timestamp: ++this.seqNum };
    this.orders.set(id, order);

    const book = side === 'BUY' ? this.bids : this.asks;
    if (!book.has(price)) {
      book.set(price, []);
    }
    book.get(price)!.push(order);

    // Sort by time priority
    book.get(price)!.sort((a, b) => a.timestamp - b.timestamp);
  }

  removeOrder(id: string): boolean {
    const order = this.orders.get(id);
    if (!order) return false;

    const book = order.side === 'BUY' ? this.bids : this.asks;
    const level = book.get(order.price);
    if (!level) return false;

    const idx = level.findIndex(o => o.id === id);
    if (idx === -1) return false;

    level.splice(idx, 1);
    if (level.length === 0) {
      book.delete(order.price);
    }

    this.orders.delete(id);
    return true;
  }

  reduceOrder(id: string, shares: number): boolean {
    const order = this.orders.get(id);
    if (!order) return false;

    order.shares = Math.max(0, order.shares - shares);

    if (order.shares === 0) {
      return this.removeOrder(id);
    }

    return true;
  }

  getBook(symbol: string): OrderBook {
    const bidLevels = this.aggregateLevels(this.bids, true);
    const askLevels = this.aggregateLevels(this.asks, false);

    const bestBid = bidLevels[0]?.price || 0;
    const bestAsk = askLevels[0]?.price || 0;

    return {
      symbol,
      bids: bidLevels,
      asks: askLevels,
      spread: bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0,
      midPrice: bestAsk > 0 && bestBid > 0 ? Math.round((bestAsk + bestBid) / 2) : bestBid || bestAsk,
      timestamp: new Date().toISOString(),
    };
  }

  private aggregateLevels(
    book: Map<number, InternalOrder[]>,
    descending: boolean
  ): BookLevel[] {
    const levels: BookLevel[] = [];

    for (const [price, orders] of book) {
      const size = orders.reduce((sum, o) => sum + o.shares, 0);
      levels.push({ price, size, orderCount: orders.length });
    }

    return levels.sort((a, b) => descending ? b.price - a.price : a.price - b.price);
  }

  /**
   * Get depth at specific price levels (for visualization)
   */
  getDepth(symbol: string, levels: number = 10): { bids: BookLevel[]; asks: BookLevel[] } {
    const book = this.getBook(symbol);
    return {
      bids: book.bids.slice(0, levels),
      asks: book.asks.slice(0, levels),
    };
  }

  clear(): void {
    this.bids.clear();
    this.asks.clear();
    this.orders.clear();
    this.seqNum = 0;
  }
}

export const orderBook = new OrderBookEngine();
