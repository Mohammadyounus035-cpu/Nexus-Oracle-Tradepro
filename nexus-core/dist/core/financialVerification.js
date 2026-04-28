import { createHash } from "node:crypto";
export const COMPOUND_DERIVATION = "principal * (1 + rate)^time";
export const COMPOUND_SOURCE = "engine.compoundInterest";
export function sanitizeNumber(input) {
    const numeric = typeof input === "number" ? input : Number(input);
    return Number.isFinite(numeric) ? numeric : 0;
}
export function hashInputs(inputs) {
    const body = JSON.stringify(inputs);
    return createHash("sha256").update(body).digest("base64url");
}
export function computeCompoundInterest(principalInput, rateInput = 0.05, timeInput = 10) {
    const principal = sanitizeNumber(principalInput);
    const rate = sanitizeNumber(rateInput);
    const time = sanitizeNumber(timeInput);
    const inputs = [principal, rate, time];
    const finalValue = principal * (1 + rate) ** time;
    const gainValue = finalValue - principal;
    const provenance = {
        source: COMPOUND_SOURCE,
        derivation: COMPOUND_DERIVATION,
        measuredAt: new Date().toISOString(),
        inputs,
        hash: hashInputs(inputs),
    };
    const final = makeClaim("final", finalValue, provenance);
    const gain = makeClaim("gain", gainValue, provenance);
    const principalClaim = makeClaim("principal", principal, provenance);
    const invariantOk = Math.abs(gain.value - (final.value - principalClaim.value)) < 1e-9;
    if (!invariantOk) {
        final.verified = false;
        gain.verified = false;
        final.reasons.push("Invariant failed: gain must equal final - principal.");
        gain.reasons.push("Invariant failed: gain must equal final - principal.");
    }
    return {
        id: `calc-${Date.now()}-${provenance.hash.slice(0, 8)}`,
        createdAt: provenance.measuredAt,
        principal: principalClaim,
        final,
        gain,
    };
}
function makeClaim(label, value, provenance) {
    const reasons = [];
    if (!provenance.source)
        reasons.push("Missing provenance.source");
    if (!provenance.derivation)
        reasons.push("Missing provenance.derivation");
    if (!provenance.hash)
        reasons.push("Missing provenance.hash");
    if (provenance.derivation !== COMPOUND_DERIVATION)
        reasons.push("Unexpected derivation.");
    return {
        label,
        value,
        provenance,
        verified: reasons.length === 0,
        reasons,
    };
}
export class AppendOnlyAuditLog {
    storageKey;
    maxEntries;
    storage;
    records;
    constructor(opts) {
        this.storage = opts?.storage;
        this.storageKey = opts?.storageKey ?? "financial.verification.audit.v1";
        this.maxEntries = opts?.maxEntries ?? 50;
        this.records = this.load();
    }
    append(record) {
        this.records = [...this.records, record].slice(-this.maxEntries);
        this.persist();
    }
    all() {
        return [...this.records];
    }
    exportJson() {
        return JSON.stringify(this.records, null, 2);
    }
    load() {
        if (!this.storage)
            return [];
        try {
            const raw = this.storage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : [];
        }
        catch {
            return [];
        }
    }
    persist() {
        if (!this.storage)
            return;
        this.storage.setItem(this.storageKey, JSON.stringify(this.records));
    }
}
export function validateClaim(record) {
    const reasons = [];
    const expectedHash = hashInputs(record.final.provenance.inputs);
    if (expectedHash !== record.final.provenance.hash) {
        reasons.push("Hash mismatch for final claim provenance inputs.");
    }
    if (record.final.provenance.derivation !== COMPOUND_DERIVATION) {
        reasons.push("Final claim derivation mismatch.");
    }
    const expectedGain = record.final.value - record.principal.value;
    if (Math.abs(record.gain.value - expectedGain) > 1e-9) {
        reasons.push("Invariant mismatch: gain !== final - principal.");
    }
    if (!record.final.provenance.source || !record.final.provenance.measuredAt) {
        reasons.push("Incomplete provenance for final claim.");
    }
    return { ok: reasons.length === 0, reasons };
}
