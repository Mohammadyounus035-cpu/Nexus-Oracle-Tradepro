import { sha256JsonStable } from "../lib/hash";
import type { Decision } from "./testMatrix";

export const SYSTEM_VERSION = "1.0.0" as const;
export const EXPECTED_FRONTIER_CARDINALITY = 36 as const;

export type Metrics = {
  safety: number;
  cost: number;
  latency: number;
};

export type FrontierCandidate = {
  id: string;
  decision: Decision;
  metrics: Metrics;
};

export type VisualPosture = "stable" | "alert" | "restricted";

export type VisualState = {
  eyeIntensity: number;
  glowSpread: number;
  posture: VisualPosture;
  background: "void";
};

export type CanonicalState = {
  frontier: FrontierCandidate[];
  selected: FrontierCandidate;
  policy: "safety-first-v1";
};

export type UnifiedState = {
  version: typeof SYSTEM_VERSION;
  canonical: CanonicalState;
  visual: VisualState;
  hashes: {
    canonical: string;
    visual: string;
    binding: string;
  };
};

function normalizeMetric(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}

function compareCandidates(a: FrontierCandidate, b: FrontierCandidate): number {
  return (
    b.metrics.safety - a.metrics.safety ||
    a.metrics.cost - b.metrics.cost ||
    a.metrics.latency - b.metrics.latency ||
    a.decision.localeCompare(b.decision) ||
    a.id.localeCompare(b.id)
  );
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
  }
  return value;
}

export function mapToVisual(frontier: FrontierCandidate[], selected: FrontierCandidate): VisualState {
  return {
    eyeIntensity: selected.metrics.safety,
    glowSpread: frontier.length / 3,
    posture:
      selected.decision === "model"
        ? "stable"
        : selected.decision === "defer"
          ? "alert"
          : "restricted",
    background: "void",
  };
}

function validateEyeIntensityRange(eyeIntensity: number): void {
  if (eyeIntensity < 0 || eyeIntensity > 1) {
    throw new Error("Invalid visual range: eyeIntensity must be between 0 and 1");
  }
}

function assertUtility(frontier: FrontierCandidate[]): void {
  if (frontier.every((candidate) => candidate.decision === "reject")) {
    throw new Error("Degenerate system: no actionable paths");
  }
}

function computeBindingHash(canonicalHash: string, visualHash: string): string {
  return sha256JsonStable({ canonical: canonicalHash, visual: visualHash });
}

export function buildUnifiedState(
  frontierInput: FrontierCandidate[],
  selectedId?: string,
): UnifiedState {
  if (frontierInput.length === 0) {
    throw new Error("Dead state: no valid decisions");
  }

  if (frontierInput.length !== EXPECTED_FRONTIER_CARDINALITY) {
    throw new Error(`state drift: expected frontier cardinality ${EXPECTED_FRONTIER_CARDINALITY}`);
  }

  const frontier = frontierInput
    .map((candidate) => ({
      ...candidate,
      metrics: {
        safety: normalizeMetric(candidate.metrics.safety),
        cost: normalizeMetric(candidate.metrics.cost),
        latency: normalizeMetric(candidate.metrics.latency),
      },
    }))
    .sort(compareCandidates);

  assertUtility(frontier);

  const selected = selectedId
    ? frontier.find((candidate) => candidate.id === selectedId)
    : frontier[0];

  if (!selected) {
    throw new Error("No selected decision — undefined visual state");
  }

  if (!frontier.some((candidate) => candidate.id === selected.id)) {
    throw new Error("Selected not in frontier");
  }

  const visual = mapToVisual(frontier, selected);
  validateEyeIntensityRange(visual.eyeIntensity);

  if (visual.eyeIntensity !== selected.metrics.safety) {
    throw new Error("Visual mismatch: safety encoding broken");
  }

  const canonical: CanonicalState = {
    frontier,
    selected,
    policy: "safety-first-v1",
  };

  const canonicalHash = sha256JsonStable(canonical);
  const visualHash = sha256JsonStable(visual);
  const bindingHash = computeBindingHash(canonicalHash, visualHash);

  return deepFreeze({
    version: SYSTEM_VERSION,
    canonical,
    visual,
    hashes: {
      canonical: canonicalHash,
      visual: visualHash,
      binding: bindingHash,
    },
  });
}

export function verifyUnifiedState(unified: UnifiedState): VisualState {
  if (unified.version !== SYSTEM_VERSION) {
    throw new Error("version mismatch");
  }

  const recomputedCanonicalHash = sha256JsonStable(unified.canonical);
  if (recomputedCanonicalHash !== unified.hashes.canonical) {
    throw new Error("Render aborted: canonical integrity failure");
  }

  const recomputedVisual = mapToVisual(
    unified.canonical.frontier,
    unified.canonical.selected,
  );
  const recomputedVisualHash = sha256JsonStable(recomputedVisual);

  if (recomputedVisualHash !== unified.hashes.visual) {
    throw new Error("Render aborted: visual integrity failure");
  }

  const recomputedBindingHash = computeBindingHash(
    recomputedCanonicalHash,
    recomputedVisualHash,
  );
  if (recomputedBindingHash !== unified.hashes.binding) {
    throw new Error("Render aborted: cross-binding integrity failure");
  }

  if (recomputedVisual.eyeIntensity !== unified.canonical.selected.metrics.safety) {
    throw new Error("Render aborted: semantic mismatch");
  }

  validateEyeIntensityRange(recomputedVisual.eyeIntensity);

  return recomputedVisual;
}

export function safeRender(
  unified: UnifiedState,
  draw: (visual: VisualState) => void,
): VisualState {
  const verifiedVisual = verifyUnifiedState(unified);
  draw(verifiedVisual);
  return verifiedVisual;
}
