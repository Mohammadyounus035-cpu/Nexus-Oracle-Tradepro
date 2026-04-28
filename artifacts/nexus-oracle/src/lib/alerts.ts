export type AlertDirection = "ABOVE" | "BELOW";

export interface PriceAlert {
  id: string;
  symbol: string;
  direction: AlertDirection;
  thresholdCents: number;
  createdAt: number;
  triggeredAt?: number;
  active: boolean;
}

export interface TriggerEvent {
  alert: PriceAlert;
  priceCents: number;
}

const STORAGE_KEY = "nexus.alerts.v1";

export class AlertManager {
  private alerts: PriceAlert[] = [];
  private lastPrices = new Map<string, number>();
  private listeners = new Set<(events: TriggerEvent[]) => void>();

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.alerts = JSON.parse(raw);
    } catch {
      this.alerts = [];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.alerts));
    } catch {
      /* ignore quota errors */
    }
  }

  list(): PriceAlert[] {
    return [...this.alerts];
  }

  forSymbol(symbol: string): PriceAlert[] {
    return this.alerts.filter(a => a.symbol === symbol);
  }

  add(symbol: string, direction: AlertDirection, thresholdCents: number): PriceAlert {
    const alert: PriceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      symbol,
      direction,
      thresholdCents,
      createdAt: Date.now(),
      active: true,
    };
    this.alerts.unshift(alert);
    this.persist();
    return alert;
  }

  remove(id: string) {
    this.alerts = this.alerts.filter(a => a.id !== id);
    this.persist();
  }

  reactivate(id: string) {
    const a = this.alerts.find(x => x.id === id);
    if (a) {
      a.active = true;
      a.triggeredAt = undefined;
      this.persist();
    }
  }

  removeBySymbol(symbol: string) {
    this.alerts = this.alerts.filter(a => a.symbol !== symbol);
    this.persist();
  }

  evaluate(prices: Map<string, { price: number }>): TriggerEvent[] {
    const events: TriggerEvent[] = [];
    let mutated = false;

    for (const alert of this.alerts) {
      if (!alert.active) continue;
      const quote = prices.get(alert.symbol);
      if (!quote) continue;

      const prev = this.lastPrices.get(alert.symbol);
      const curr = quote.price;

      let crossed = false;
      if (prev === undefined) {
        if (alert.direction === "ABOVE" && curr >= alert.thresholdCents) crossed = true;
        if (alert.direction === "BELOW" && curr <= alert.thresholdCents) crossed = true;
      } else {
        if (alert.direction === "ABOVE" && prev < alert.thresholdCents && curr >= alert.thresholdCents) crossed = true;
        if (alert.direction === "BELOW" && prev > alert.thresholdCents && curr <= alert.thresholdCents) crossed = true;
      }

      if (crossed) {
        alert.active = false;
        alert.triggeredAt = Date.now();
        mutated = true;
        events.push({ alert: { ...alert }, priceCents: curr });
      }
    }

    prices.forEach((q, sym) => this.lastPrices.set(sym, q.price));

    if (mutated) this.persist();
    if (events.length > 0) this.listeners.forEach(l => l(events));
    return events;
  }

  subscribe(listener: (events: TriggerEvent[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
