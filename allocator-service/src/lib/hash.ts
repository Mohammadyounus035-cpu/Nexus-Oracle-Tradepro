import crypto from "node:crypto";

/**
 * Compute the SHA-256 hash of the JSON representation of a value.
 *
 * @param value - Value to serialize with `JSON.stringify` before hashing
 * @returns Hex-encoded SHA-256 digest of the serialized value
 */
export function sha256Json(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
