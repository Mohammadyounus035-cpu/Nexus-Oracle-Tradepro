// Persistent Identity Layer (IndexedDB + Ed25519)
const DB_NAME = "omega_identity";
const STORE = "keys";

function openDB(){
  return new Promise((res,rej)=>{
    const req = indexedDB.open(DB_NAME,1);
    req.onupgradeneeded = ()=>{
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = ()=>res(req.result);
    req.onerror = ()=>rej(req.error);
  });
}

async function saveKeyPair(keyPair){
  const db = await openDB();
  const tx = db.transaction(STORE,"readwrite");
  const store = tx.objectStore(STORE);
  const pub = await crypto.subtle.exportKey("spki",keyPair.publicKey);
  const priv = await crypto.subtle.exportKey("pkcs8",keyPair.privateKey);
  store.put({
    publicKey: btoa(String.fromCharCode(...new Uint8Array(pub))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(priv)))
  },"identity");
}

async function loadKeyPair(){
  const db = await openDB();
  const tx = db.transaction(STORE,"readonly");
  const store = tx.objectStore(STORE);
  return new Promise((res)=>{
    const req = store.get("identity");
    req.onsuccess = async ()=>{
      if(!req.result) return res(null);
      const pub = Uint8Array.from(atob(req.result.publicKey),c=>c.charCodeAt(0));
      const priv = Uint8Array.from(atob(req.result.privateKey),c=>c.charCodeAt(0));
      const publicKey = await crypto.subtle.importKey("spki",pub,{name:"Ed25519"},true,["verify"]);
      const privateKey = await crypto.subtle.importKey("pkcs8",priv,{name:"Ed25519"},true,["sign"]);
      res({publicKey,privateKey});
    };
  });
}

async function getOrCreateIdentity(){
  let kp = await loadKeyPair();
  if(kp) return kp;
  kp = await crypto.subtle.generateKey({name:"Ed25519"},true,["sign","verify"]);
  await saveKeyPair(kp);
  return kp;
}

export { getOrCreateIdentity };