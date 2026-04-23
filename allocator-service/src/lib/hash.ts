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
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalize((value as Record<string, unknown>)[key]);
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
}
