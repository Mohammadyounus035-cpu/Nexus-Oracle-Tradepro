// 🔱 TRUST ROOT ENFORCEMENT LAYER

// Hardcoded trusted authority keys (ROOT OF TRUST)
export const TRUSTED_KEYS: string[] = [
  "MCowBQYDK2VwAyEAKccsyrVpp+LvRQ6BERx7xzfhOBJFtDfTHvWzgNtnmqs="
];

// Trust classification
export type TrustLevel = "VERIFIED" | "VALID_UNTRUSTED" | "REJECTED";

export function classifyTrust(proof: any, signatureValid: boolean): TrustLevel {
  const isTrustedKey = TRUSTED_KEYS.includes(proof.publicKey);

  if (signatureValid && isTrustedKey) {
    return "VERIFIED";
  }

  if (signatureValid && !isTrustedKey) {
    return "VALID_UNTRUSTED";
  }

  return "REJECTED";
}

// Enforced authority check
export function enforceTrust(proof: any, signatureValid: boolean) {
  const level = classifyTrust(proof, signatureValid);

  if (level === "REJECTED") {
    throw new Error("Invariant breach: invalid signature");
  }

  if (level === "VALID_UNTRUSTED") {
    console.warn("Untrusted signer detected");
  }

  return level;
}
