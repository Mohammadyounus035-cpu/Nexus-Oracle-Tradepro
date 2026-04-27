import { HFCECore } from "./engine/HFCECore.js";

const core = new HFCECore();
const program = ["GROUND", "ADVANCE", "DETECT", "CONVERGE", "STABILIZE"] as const;

for (const op of program) {
  const result = core.step(op, 0.02);
  console.log(op, result.state, result.mirror);
}
export {
  toCents,
  fromCents,
  compoundCents,
  assertInvariant,
  formatUSD,
  calculateVerified,
  CalcSchema
} from "./money"

export type { VerifiedResult, CalcInput } from "./money"

export { canonicalize } from "./canonical"
export type { CanonicalPayload } from "./canonical"

export { sha256 } from "./crypto"

export { verifyProof, verifySignature, importPublicKey } from "./signing"

export {
  calculateBound,
  exportProof
} from "./proof"

export type { BoundProof } from "./proof"

export { reconstructCanonicalPayload, verifyStandaloneProof } from "./standaloneVerifier"
export type { StandaloneVerificationResult } from "./standaloneVerifier"

export { default as VerificationPanel } from "./VerificationPanel"
