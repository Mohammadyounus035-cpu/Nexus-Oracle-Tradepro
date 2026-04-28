import { computeCompoundInterest, validateClaim } from "../core/financialVerification.js";
import { attachSignature, verifySignedRecord, } from "../core/signing.js";
import { transition } from "./engine.js";
export async function calculateSigned(principal, keyPair, rate = 0.05, time = 10) {
    const record = computeCompoundInterest(principal, rate, time);
    return attachSignature(record, keyPair.privateKeyPem, keyPair.publicKeyPem);
}
export async function verifyIntegrity(signed) {
    const claim = validateClaim(signed.record);
    const signature = verifySignedRecord(signed);
    const reasons = [...claim.reasons];
    if (!signature.signatureValid)
        reasons.push("Signature check failed.");
    if (!signature.hashValid)
        reasons.push("Signed hash check failed.");
    return {
        trustworthy: claim.ok && signature.authentic,
        claimOk: claim.ok,
        signatureOk: signature.authentic,
        reasons,
    };
}
export async function runCalculationCycle(state, ctx, keyPair, input) {
    const next = transition(state, ctx, input);
    if (next.state !== "ACTIVE") {
        return next;
    }
    const signed = await calculateSigned(next.ctx.input, keyPair);
    const integrity = await verifyIntegrity(signed);
    if (!integrity.trustworthy) {
        return { state: "ERROR", ctx: next.ctx, signed, integrity };
    }
    return { state: "VERIFYING", ctx: next.ctx, signed, integrity };
}
