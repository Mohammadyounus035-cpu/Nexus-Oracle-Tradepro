import { createHash } from "node:crypto";
function normalize(value) {
    if (Array.isArray(value)) {
        return value.map(normalize);
    }
    if (value && typeof value === "object") {
        const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
        return Object.fromEntries(entries.map(([key, child]) => [key, normalize(child)]));
    }
    return value;
}
export function stableStringify(value) {
    return JSON.stringify(normalize(value), null, 2);
}
export function sha256Hex(content) {
    return createHash("sha256").update(content, "utf8").digest("hex");
}
