import { DEFAULT_ADAPTIVE_PROFILE, DEFAULT_STATE } from "../core/constants.js";
import { adaptAlignment } from "../core/adaptation.js";
import { runMirror } from "../core/mirror.js";
import { applyInstruction } from "../core/transitions.js";
import type {
  AdaptiveProfile,
  CoherenceState,
  Instruction,
  MirrorReport,
  Observation
} from "../core/types.js";

export class HFCECore {
  public state: CoherenceState;
  public profile: AdaptiveProfile;
  public tick = 0;
  public observations: Observation[] = [];
  public adaptationFrozen = false;

  constructor(
    state: CoherenceState = DEFAULT_STATE,
    profile: AdaptiveProfile = DEFAULT_ADAPTIVE_PROFILE
  ) {
    this.state = state;
    this.profile = profile;
  }

  public step(
    instruction: Instruction,
    feedback = 0
  ): { state: CoherenceState; mirror: MirrorReport } {
    const progressed = applyInstruction(this.state, instruction);
    const adapted = this.adaptationFrozen
      ? progressed
      : adaptAlignment(progressed, feedback, this.profile);

    this.state = adapted;
    this.tick += 1;

    const mirror = runMirror(this.state);

    this.observations.push({
      tick: this.tick,
      nodeId: this.state.id,
      coherence: this.state.coherence,
      alignment: this.state.alignment,
      shellIntegrity: this.state.shellIntegrity,
      symbolicLoad: this.state.symbolicLoad,
      temporalOffset: this.state.temporalOffset,
      faults: [...this.state.faultFlags],
      driftScore: mirror.driftScore
    });

    return {
      state: this.state,
      mirror
    };
  }

  public freezeAdaptation(): void {
    this.adaptationFrozen = true;
  }

  public unfreezeAdaptation(): void {
    this.adaptationFrozen = false;
  }
}
