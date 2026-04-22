import { clamp } from "./invariants.js";
import type { AdaptiveProfile, CoherenceState } from "./types.js";

export function adaptAlignment(
  state: CoherenceState,
  feedback: number,
  profile: AdaptiveProfile
): CoherenceState {
  if (!profile.updateEnabled) {
    return state;
  }

  const delta = clamp(
    profile.learningRate * feedback,
    -profile.driftTolerance,
    profile.driftTolerance
  );

  return {
    ...state,
    alignment: clamp(state.alignment + delta, 0, 1)
  };
}
