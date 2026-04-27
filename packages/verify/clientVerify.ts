// 🔱 CLIENT VERIFICATION LAYER — Ed25519 + Hash Enforcement

import nacl from 'tweetnacl';

function decodeBase64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function equalBytes(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let v = 0;
  for (let i = 0; i < a.length; i++) v |= a[i] ^ b[i];
  return v === 0;
}

export async function verifyProof(proof: any): Promise<boolean> {
  try {
    const canonicalBytes = decodeBase64(proof.canonicalPayload);

    const hashBuffer = await crypto.subtle.digest('SHA-256', canonicalBytes);
    const localHash = new Uint8Array(hashBuffer);

    const serverHash = /^[0-9a-fA-F]+$/.test(proof.hash)
      ? hexToBytes(proof.hash)
      : decodeBase64(proof.hash);

    if (!equalBytes(localHash, serverHash)) {
      console.error('Hash mismatch');
      return false;
    }

    const sig = decodeBase64(proof.signature);
    const pub = decodeBase64(proof.publicKey);

    const verified = nacl.sign.detached.verify(localHash, sig, pub);

    if (!verified) {
      console.error('Signature verification failed');
      return false;
    }

    return true;
  } catch (err) {
    console.error('Verification error', err);
    return false;
  }
}
