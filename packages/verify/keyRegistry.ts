// Multi-authority registry with rotation support

export const KEY_REGISTRY = [
  {
    id: "omega-root-1",
    publicKey: "MCowBQYDK2VwAyEAKccsyrVpp+LvRQ6BERx7xzfhOBJFtDfTHvWzgNtnmqs=",
    status: "ACTIVE",
    createdAt: "2026-04-25T00:00:00Z"
  }
];

export function getAuthority(publicKey) {
  return KEY_REGISTRY.find(a => a.publicKey === publicKey);
}

export function isAuthorityValid(authority) {
  if (!authority) return false;
  if (authority.status !== "ACTIVE") return false;
  return true;
}

export function classifyAuthority(proof, signatureValid) {
  const authority = getAuthority(proof.publicKey);

  if (!signatureValid) return "REJECTED";
  if (!authority) return "UNKNOWN_AUTHORITY";
  if (!isAuthorityValid(authority)) return "REVOKED";

  return "TRUSTED";
}

export function rotateKey(oldKey, newKey) {
  const authority = getAuthority(oldKey);
  if (authority) authority.status = "ROTATED";

  KEY_REGISTRY.push({
    id: `omega-root-${KEY_REGISTRY.length + 1}`,
    publicKey: newKey,
    status: "ACTIVE",
    createdAt: new Date().toISOString()
  });
}
