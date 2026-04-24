import { canonicalize, type CanonicalPayload } from "./canonical"
import { sha256 } from "./crypto"
import { assertInvariant, compoundCents, toCents, type CalcInput } from "./money"

export type KeyPair = {
  publicKey: CryptoKey
  privateKey: CryptoKey
}

export type BoundProof = {
  timestamp: string
  system: {
    state: "HOLD"
    context: {
      output: 1
      drift: 0
    }
  }
  data: CanonicalPayload
  verification: {
    hash: string
    signature: string
    publicKey: string
  }
}

export type SignedResult = BoundProof

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function base64ToBytes(base64: string): Uint8Array {
  const bin = atob(base64)
  const out = new Uint8Array(bin.length)

  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i)
  }

  return out
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", key)
  return bytesToBase64(new Uint8Array(exported))
}

export async function importPublicKey(base64: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey("spki", base64ToBytes(base64), { name: "Ed25519" }, true, ["verify"])
}

export async function generateSigningKeyPair(): Promise<KeyPair> {
  const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])
  return {
    publicKey: pair.publicKey,
    privateKey: pair.privateKey
  }
}

export async function signPayload(canonical: string, privateKey: CryptoKey): Promise<string> {
  const encoded = new TextEncoder().encode(canonical)
  const sig = await crypto.subtle.sign({ name: "Ed25519" }, privateKey, encoded)
  return bytesToBase64(new Uint8Array(sig))
}

export async function verifySignature(canonical: string, signature: string, publicKeyBase64: string): Promise<boolean> {
  const publicKey = await importPublicKey(publicKeyBase64)
  const encoded = new TextEncoder().encode(canonical)
  return await crypto.subtle.verify(
    { name: "Ed25519" },
    publicKey,
    base64ToBytes(signature),
    encoded
  )
}

export async function calculateBound(input: CalcInput, keyPair: KeyPair): Promise<BoundProof> {
  const p = toCents(input.principal)
  const f = compoundCents(p, input.rate, input.years)
  const g = f - p

  assertInvariant(p, f, g)

  const payload: CanonicalPayload = {
    principal: input.principal,
    rate: input.rate,
    years: input.years,
    final: f / 100,
    gain: g / 100
  }

  const canonical = canonicalize(payload)
  const hash = await sha256(canonical)
  const signature = await signPayload(canonical, keyPair.privateKey)
  const publicKey = await exportPublicKey(keyPair.publicKey)

  return Object.freeze({
    timestamp: new Date().toISOString(),
    system: {
      state: "HOLD",
      context: {
        output: 1,
        drift: 0
      }
    },
    data: payload,
    verification: {
      hash,
      signature,
      publicKey
    }
  })
}

export async function verifyProof(proof: BoundProof): Promise<{
  hashValid: boolean
  signatureValid: boolean
  trustworthy: boolean
}> {
  const canonical = canonicalize(proof.data)
  const hashValid = (await sha256(canonical)) === proof.verification.hash
  const signatureValid = await verifySignature(canonical, proof.verification.signature, proof.verification.publicKey)

  return {
    hashValid,
    signatureValid,
    trustworthy: hashValid && signatureValid
  }
}

export async function calculateSigned(input: CalcInput, keyPair: KeyPair): Promise<SignedResult> {
  return calculateBound(input, keyPair)
}

export async function verifyIntegrity(proof: SignedResult): Promise<{
  hashValid: boolean
  signatureValid: boolean
  trustworthy: boolean
}> {
  return verifyProof(proof)
}
