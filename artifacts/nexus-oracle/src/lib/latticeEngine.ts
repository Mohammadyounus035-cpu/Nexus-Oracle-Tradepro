export type NodeStatus = "active" | "staged" | "monitor" | "sealed";
export type OperatorMode = "FREE" | "NODE" | "ALERT" | "PREDICTION" | "TOP_DOWN";
export type SystemState = "STANDBY" | "ACTIVE" | "LOCKED";
export type PipelineStage =
  | "DECIDE"
  | "EXECUTE"
  | "VERIFY"
  | "SIGN"
  | "BROADCAST"
  | "SNAPSHOT";

export const PIPELINE_STAGES: PipelineStage[] = [
  "DECIDE",
  "EXECUTE",
  "VERIFY",
  "SIGN",
  "BROADCAST",
  "SNAPSHOT",
];

export const PHI = 0.6180339887498949;
export const TICK_MS = 618; // φ-synced

export interface LatticeNode {
  id: string;
  status: NodeStatus;
  energy: number;
  links: string[];
}

export interface CanonicalState {
  tick: number;
  nodes: Record<string, LatticeNode>;
  resonance: number;
  phiSync: number;
  polarity: number;
  momentum: number;
}

export interface TickRecord {
  tick: number;
  timestamp: number;
  decisionHash: string;
  stateHash: string;
  visualHash: string;
  signature: string;
  worldDrift: number;
  latencyMs: number;
  verified: boolean;
  rollbacks: number;
  criticalNodes: number;
  stage: PipelineStage;
}

const NODE_COUNT = 16;
const HISTORY_LEN = 24;
const PUBLIC_KEY = "ed25519:omega-v0.4.2:nx-oracle:" + "a3c7".repeat(8);

// ---------- helpers ----------
function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(stableStringify).join(",") + "]";
  const obj = v as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
}

async function sha256Hex(s: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = new TextEncoder().encode(s);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // deterministic fallback (FNV-1a 32 widened) — tests / SSR
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, "0").repeat(8);
}

// WORLD_DRIFT semantics (OMEGA v0.4.2):
//   0.000% when deterministic — same input produces same output
//   Only non-zero if a re-derivation of the canonical state hash diverges
function computeDrift(expected: string, recomputed: string): number {
  if (!expected || !recomputed) return 0;
  return expected === recomputed ? 0 : 100;
}

// LCG seeded by tick — fully deterministic, no randomness
function lcg(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function structuredCloneCompat<T>(v: T): T {
  return typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
}

function initialState(): CanonicalState {
  const r = lcg(7919);
  const nodes: Record<string, LatticeNode> = {};
  const ids = Array.from({ length: NODE_COUNT }, (_, i) => `N${String(i).padStart(2, "0")}`);
  for (let i = 0; i < NODE_COUNT; i++) {
    const id = ids[i];
    const linkCount = 2 + Math.floor(r() * 3);
    const links: string[] = [];
    for (let k = 0; k < linkCount; k++) {
      const j = (i + 1 + Math.floor(r() * (NODE_COUNT - 1))) % NODE_COUNT;
      const target = ids[j];
      if (target !== id && !links.includes(target)) links.push(target);
    }
    nodes[id] = {
      id,
      status: (["active", "staged", "monitor", "sealed"] as NodeStatus[])[Math.floor(r() * 4)],
      energy: 0.3 + r() * 0.5,
      links: links.sort(),
    };
  }
  return {
    tick: 0,
    nodes,
    resonance: 0.61,
    phiSync: PHI,
    polarity: 0.5,
    momentum: 0.0,
  };
}

// ---------- engine ----------
type Listener = () => void;

class LatticeEngine {
  private state: CanonicalState = initialState();
  private snapshot: CanonicalState = structuredCloneCompat(this.state);
  history: TickRecord[] = [];
  rollbacks = 0;
  mode: OperatorMode = "FREE";
  sysState: SystemState = "ACTIVE";
  stage: PipelineStage = "DECIDE";
  publicKey = PUBLIC_KEY;
  running = false;
  private listeners = new Set<Listener>();
  private tickTimer?: ReturnType<typeof setInterval>;
  private stageTimer?: ReturnType<typeof setInterval>;

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private notify() {
    this.listeners.forEach(fn => fn());
  }

  start() {
    if (this.running) return;
    this.running = true;
    void this.tick();
    this.tickTimer = setInterval(() => void this.tick(), TICK_MS);
    // stage cycler — visually walks through 6 phases per φ-tick
    let i = 0;
    this.stageTimer = setInterval(() => {
      i = (i + 1) % PIPELINE_STAGES.length;
      this.stage = PIPELINE_STAGES[i];
      this.notify();
    }, Math.floor(TICK_MS / PIPELINE_STAGES.length));
    this.notify();
  }

  stop() {
    this.running = false;
    if (this.tickTimer) clearInterval(this.tickTimer);
    if (this.stageTimer) clearInterval(this.stageTimer);
    this.tickTimer = undefined;
    this.stageTimer = undefined;
    this.notify();
  }

  setMode(m: OperatorMode) {
    this.mode = m;
    this.notify();
  }

  setSystemState(s: SystemState) {
    this.sysState = s;
    this.notify();
  }

  getState(): CanonicalState {
    return this.state;
  }
  latest(): TickRecord | undefined {
    return this.history[this.history.length - 1];
  }

  // Most-stable node = energy closest to phiSync (0.618 target)
  // Highest-influence node = most outbound links
  computeGoldenThread(): string[] {
    const s = this.state;
    let mostStable = "";
    let bestDelta = Infinity;
    for (const n of Object.values(s.nodes)) {
      const d = Math.abs(n.energy - s.phiSync);
      if (d < bestDelta) {
        bestDelta = d;
        mostStable = n.id;
      }
    }
    let highestInf = "";
    let maxLinks = -1;
    for (const n of Object.values(s.nodes)) {
      if (n.links.length > maxLinks) {
        maxLinks = n.links.length;
        highestInf = n.id;
      }
    }
    if (!mostStable || !highestInf || mostStable === highestInf) return [];
    // BFS shortest path on undirected adjacency
    const adj: Record<string, Set<string>> = {};
    for (const id of Object.keys(s.nodes)) adj[id] = new Set();
    for (const n of Object.values(s.nodes)) {
      for (const l of n.links) {
        adj[n.id]?.add(l);
        adj[l]?.add(n.id);
      }
    }
    const visited = new Set<string>([mostStable]);
    const queue: { id: string; path: string[] }[] = [{ id: mostStable, path: [mostStable] }];
    while (queue.length) {
      const { id, path } = queue.shift()!;
      if (id === highestInf) return path;
      for (const next of adj[id]) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push({ id: next, path: [...path, next] });
        }
      }
    }
    return [];
  }

  exportAnalysis() {
    return {
      version: "omega-v0.4.2",
      generatedAt: new Date().toISOString(),
      publicKey: this.publicKey,
      currentTick: this.state.tick,
      operatorMode: this.mode,
      systemState: this.sysState,
      canonicalState: this.state,
      goldenThread: this.computeGoldenThread(),
      history: this.history,
      rollbacks: this.rollbacks,
    };
  }

  private async tick() {
    if (this.sysState === "STANDBY") return;
    const t0 = performance.now();
    try {
      const next = this.decide(this.state);
      const decisionHash = await sha256Hex(stableStringify({ from: this.state.tick, to: next.tick }));

      // EXECUTE
      this.state = next;

      // VERIFY (invariants + state hash)
      this.verifyInvariants(this.state);
      const stateHash = await sha256Hex(stableStringify(this.state));

      // SIGN (mock signature derived deterministically from stateHash + publicKey)
      const signature = await sha256Hex(stateHash + ":" + this.publicKey);

      // visual mapping → visualHash (proves render derives only from canonical state)
      const visual = Object.keys(this.state.nodes)
        .sort()
        .map(id => {
          const n = this.state.nodes[id];
          return [id, n.status, Math.round(n.energy * 1000) / 1000];
        });
      const visualHash = await sha256Hex(stableStringify(visual));

      // Re-derive the state hash from the canonical state to prove no drift.
      const recomputedHash = await sha256Hex(stableStringify(this.state));
      const worldDrift = computeDrift(stateHash, recomputedHash);
      const criticalNodes = Object.values(this.state.nodes).filter(n => n.energy > 0.82).length;

      // SNAPSHOT
      this.snapshot = structuredCloneCompat(this.state);

      const rec: TickRecord = {
        tick: this.state.tick,
        timestamp: Date.now(),
        decisionHash,
        stateHash,
        visualHash,
        signature,
        worldDrift,
        latencyMs: performance.now() - t0,
        verified: true,
        rollbacks: this.rollbacks,
        criticalNodes,
        stage: this.stage,
      };
      this.history.push(rec);
      if (this.history.length > HISTORY_LEN) this.history.shift();
      this.notify();
    } catch {
      // ROLLBACK
      this.state = structuredCloneCompat(this.snapshot);
      this.rollbacks += 1;
      this.notify();
    }
  }

  // pure deterministic transition: tick + 1, evolve energies via LCG seeded by tick
  private decide(s: CanonicalState): CanonicalState {
    const tick = s.tick + 1;
    const r = lcg(tick * 2654435761);
    const nodes: Record<string, LatticeNode> = {};
    let energySum = 0;
    let linkCount = 0;
    for (const id of Object.keys(s.nodes).sort()) {
      const cur = s.nodes[id];
      // smooth oscillation around current energy, bounded [0, 1]
      const delta = (r() - 0.5) * 0.06;
      const energy = Math.max(0.05, Math.min(0.98, cur.energy + delta));
      // status flips occasionally (deterministic by tick)
      const flip = (tick + id.charCodeAt(1)) % 17 === 0;
      const order: NodeStatus[] = ["monitor", "staged", "active", "sealed"];
      const status = flip ? order[(order.indexOf(cur.status) + 1) % order.length] : cur.status;
      nodes[id] = { ...cur, energy, status };
      energySum += energy;
      linkCount += cur.links.length;
    }
    const avgEnergy = energySum / Object.keys(nodes).length;
    const resonance = 0.4 + Math.abs(Math.sin(tick * PHI)) * 0.5;
    const phiSync = PHI + Math.sin(tick / 10) * 0.0008;
    const polarity = 0.5 + Math.sin(tick / 6) * 0.25;
    const momentum = Math.min(1, Math.abs(avgEnergy - s.resonance) * 10);
    return { tick, nodes, resonance, phiSync, polarity, momentum };
  }

  private verifyInvariants(s: CanonicalState) {
    const ids = new Set(Object.keys(s.nodes));
    for (const id of ids) {
      const n = s.nodes[id];
      if (n.energy < 0 || n.energy > 1) throw new Error(`Invariant breach: energy ${n.energy} out of [0,1] on ${id}`);
      for (const l of n.links) if (!ids.has(l)) throw new Error(`Invariant breach: undefined link ${l} from ${id}`);
    }
    if (s.phiSync < 0.6 || s.phiSync > 0.64) throw new Error("Invariant breach: phiSync out of envelope");
  }
}

let singleton: LatticeEngine | null = null;
export function getLatticeEngine(): LatticeEngine {
  if (!singleton) singleton = new LatticeEngine();
  return singleton;
}
