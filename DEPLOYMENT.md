# 🚀 DEPLOYMENT — VERIFIED SYSTEM (GitHub Codespaces / Dev URL)

## Your Active Environment
Dev URL:
https://cautious-umbrella-5vqxg6qw4p7p37qj-42197.app.github.dev/

---

## 🔱 What Must Be Running

### 1. Frontend (UI)
- TradePro UI
- Uses: `secureExecute()`

### 2. Backend (CRITICAL)
- `/sign` endpoint must be running
- Port: 3001 (or proxied)

Run:

```bash
cd apps/server
npm install
node src/server.ts
```

---

## 🔌 Connect Frontend → Backend

Update frontend calls:

```js
fetch('/sign')
```

If using Codespaces, ensure:

```js
fetch('https://<your-dev-url>/sign')
```

---

## 🔒 Verification Requirement

System MUST:

- Call `/sign`
- Verify SHA-256
- Verify Ed25519 signature
- BLOCK UI if invalid

---

## 📜 Audit

Every action:
- Logged via `auditLog.ts`
- Exportable

---

## ⚠️ If It Doesn't Work

Check:

1. Server running
2. CORS enabled
3. Correct URL
4. Console errors

---

## ✅ FINAL STATE

Working system:

- Deterministic pipeline
- Cryptographic verification
- UI enforcement
- Audit logging

---

## 🔱 LAW

DECIDE → EXECUTE → VERIFY

No exceptions.
