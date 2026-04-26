import crypto from "node:crypto";

function normalizeString(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function normalizeNumber(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Cannot hash non-finite numbers.");
  }

  if (Object.is(value, -0)) {
    return 0;
  }

  if (Number.isInteger(value)) {
    return value;
  }

  return Number(value.toFixed(12));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortKeys(entry));
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalize((value as Record<string, unknown>)[key]);
        acc[key] = sortKeys((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  if (typeof value === "string") {
    return normalizeString(value);
  }

  if (typeof value === "number") {
    return normalizeNumber(value);
  }

  return value;
}

export function sha256Json(value: unknown): string {
  const canonicalJson = `${JSON.stringify(canonicalize(value))}\n`;
  return crypto.createHash("sha256").update(canonicalJson, "utf8").digest("hex");
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
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
  return sha256(stableStringify(value));
}

export function sha256JsonStable(value: unknown): string {
export function sha256StableJson(value: unknown): string {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}
