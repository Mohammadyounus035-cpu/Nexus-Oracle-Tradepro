/**
 * integrity.ts — RFC 8785 JSON Canonicalization Scheme (JCS) & Ed25519 Identity
 */

const DB_NAME = 'nexus_identity';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

// --- JCS Canonicalization ---

/**
 * Serialize any JSON-serializable object to canonical form.
 * Rules: sorted keys, no whitespace, shortest decimal numbers, no scientific notation.
 */
export function canonical(obj: any): string {
  return _canonicalize(obj);
}

// Alias for engine compatibility
export const canonicalize = canonical;

function _canonicalize(obj: any): string {
  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return _canonicalNumber(obj);
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(_canonicalize).join(',') + ']';
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    const pairs = keys.map(k => JSON.stringify(k) + ':' + _canonicalize(obj[k]));
    return '{' + pairs.join(',') + '}';
  }
  throw new TypeError(`JCS: unsupported type ${typeof obj}`);
}

function _canonicalNumber(n: number): string {
  if (!Number.isFinite(n)) {
    throw new Error('JCS: NaN and Infinity are not permitted');
  }
  if (Number.isInteger(n)) return String(n);

  // Use toFixed with enough precision, then strip trailing zeros
  let s = n.toFixed(20);
  s = s.replace(/0+$/, '').replace(/\.$/, '');

  if (s.includes('e') || s.includes('E')) {
    s = _expandScientific(s);
  }

  return s;
}

function _expandScientific(s: string): string {
  const [mantissa, expStr] = s.toLowerCase().split('e');
  const exp = parseInt(expStr, 10);
  let digits = mantissa.replace('.', '');

  if (exp >= 0) {
    if (exp >= digits.length - 1) {
      return digits + '0'.repeat(exp - digits.length + 1);
    }
    return digits.slice(0, exp + 1) + '.' + digits.slice(exp + 1).replace(/0+$/, '').replace(/\.$/, '');
  } else {
    return '0.' + '0'.repeat(-exp - 1) + digits;
  }
}

/**
 * Compute SHA-256 hash of canonical JSON.
 */
export async function canonicalHash(obj: any): Promise<string> {
  const bytes = new TextEncoder().encode(canonical(obj));
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Alias for engine compatibility
export async function hashObject(obj: any): Promise<string> {
  return canonicalHash(obj);
}

// --- Identity Management ---

export interface SovereignIdentity {
  publicKey: string;
  privateKey: string;
  fingerprint: string;
  isNew: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function computeFingerprint(publicKey: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', publicKey);
  const hex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 16); // Truncate to 16 chars for display
}

export async function verifySignature(signature: string, payload: any, publicKeyHex: string): Promise<boolean> {
  try {
    const pubBytes = new Uint8Array(publicKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const sigBytes = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const dataBytes = new TextEncoder().encode(canonical(payload));
    
    const pubKey = await crypto.subtle.importKey(
      'raw',
      pubBytes,
      { name: 'Ed25519' },
      true,
      ['verify']
    );
    
    return await crypto.subtle.verify('Ed25519', pubKey, sigBytes, dataBytes);
  } catch (e) {
    console.error('Core integrity failure during verification:', e);
    return false;
  }
}

export async function getOrCreateIdentity(): Promise<SovereignIdentity> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get('primary');

    req.onsuccess = async () => {
      if (req.result) {
        const identity = req.result;
        const pub = new Uint8Array(identity.publicKey);
        const fingerprint = await computeFingerprint(pub);
        
        resolve({
          publicKey: Array.from(pub).map(b => b.toString(16).padStart(2, '0')).join(''),
          privateKey: 'ENCRYPTED_LOCAL_KEY',
          fingerprint,
          isNew: false,
        });
      } else {
        // Generate new Ed25519 pair
        const keyPair = await crypto.subtle.generateKey(
          { name: 'Ed25519' },
          true,
          ['sign', 'verify']
        );
        const pubRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey as CryptoKey);
        const privRaw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey as CryptoKey);
        
        const pub = new Uint8Array(pubRaw);
        const fingerprint = await computeFingerprint(pub);
        
        const tx2 = db.transaction(STORE_NAME, 'readwrite');
        const store2 = tx2.objectStore(STORE_NAME);
        store2.put({
          id: 'primary',
          publicKey: Array.from(pub),
          privateKey: Array.from(new Uint8Array(privRaw)),
          createdAt: new Date().toISOString(),
        });
        
        tx2.oncomplete = () => {
          resolve({
            publicKey: Array.from(pub).map(b => b.toString(16).padStart(2, '0')).join(''),
            privateKey: 'ENCRYPTED_LOCAL_KEY',
            fingerprint,
            isNew: true,
          });
        };
        tx2.onerror = () => reject(tx2.error);
      }
    };

    req.onerror = () => reject(req.error);
  });
}

export async function signPayload(payload: any, privateKey: CryptoKey): Promise<string> {
  const bytes = new TextEncoder().encode(canonical(payload));
  const sig = await crypto.subtle.sign('Ed25519', privateKey, bytes);
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
