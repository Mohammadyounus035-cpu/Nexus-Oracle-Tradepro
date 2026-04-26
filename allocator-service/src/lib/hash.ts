import crypto from "node:crypto";

function stableStringify(value: unknown): string {
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  const objectValue = value as Record<string, unknown>;
  const keys = Object.keys(objectValue)
    .filter((key) => objectValue[key] !== undefined)
    .sort();

  const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`);
  return `{${entries.join(",")}}`;
  const keys = Object.keys(objectValue).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`)
    .join(",")}}`;
}

export function sha256Json(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function sha256JsonStable(value: unknown): string {
export function sha256StableJson(value: unknown): string {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}
