import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify, } from "node:crypto";
function canonicalize(value) {
    if (value === null || typeof value !== "object") {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return `[${value.map((item) => canonicalize(item)).join(",")}]`;
    }
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries
        .map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`)
        .join(",")}}`;
}
export function generateSigningKeyPair() {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    return {
        publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
        privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    };
}
export function fingerprintPublicKey(publicKeyPem) {
    return createHash("sha256").update(publicKeyPem).digest("hex");
}
export function signRecord(record, privateKeyPem) {
    const payload = canonicalize(record);
    const privateKey = createPrivateKey(privateKeyPem);
    return sign(null, Buffer.from(payload), privateKey).toString("hex");
}
export function verifyRecordSignature(record, signatureHex, publicKeyPem) {
    const payload = canonicalize(record);
    const publicKey = createPublicKey(publicKeyPem);
    return verify(null, Buffer.from(payload), publicKey, Buffer.from(signatureHex, "hex"));
}
export function attachSignature(record, privateKeyPem, publicKeyPem) {
    const signatureHex = signRecord(record, privateKeyPem);
    return Object.freeze({
        record,
        signatureHex,
        publicKeyPem,
        signedAt: new Date().toISOString(),
    });
}
export function verifySignedRecord(signed) {
    const signatureValid = verifyRecordSignature(signed.record, signed.signatureHex, signed.publicKeyPem);
    const hashValid = signed.record.final.provenance.hash ===
        createHash("sha256").update(JSON.stringify(signed.record.final.provenance.inputs)).digest("base64url");
    return {
        hashValid,
        signatureValid,
        authentic: hashValid && signatureValid,
    };
}
