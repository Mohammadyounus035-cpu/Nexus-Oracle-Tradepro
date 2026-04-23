import { AUTHS, DECISIONS, ENVS, MODES, RISKS, type Vector } from "./testMatrix";
import { isValidVector } from "./constraints";

export function generateValidVectors(): Vector[] {
  const vectors: Vector[] = [];

  for (const env of ENVS) {
    for (const mode of MODES) {
      for (const risk of RISKS) {
        for (const decision of DECISIONS) {
          for (const auth of AUTHS) {
            const candidate: Vector = { env, mode, risk, decision, auth };
            if (isValidVector(candidate)) {
              vectors.push(candidate);
            }
          }
        }
      }
    }
  }

  return vectors;
}
