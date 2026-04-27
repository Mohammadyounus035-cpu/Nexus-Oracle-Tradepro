# 🔱 OMEGA MERGE PLAN — Repository Integration

## Objective
Merge Oracle UI + Ω Pipeline + Cryptographic Verification Layer into a single deterministic system.

---

## Phase 1 — Core (DONE)
- [x] omegaPipeline.ts added
- [x] Deterministic hashing (SHA-256)
- [x] Recurrence detection

---

## Phase 2 — UI Integration
Update App.tsx:

- Replace handleTransmit with omegaPipeline
- Remove fake "Ω-Verified"
- Display:
  - hash
  - recurrence flag
  - phiSync

---

## Phase 3 — Verification Layer (CRITICAL)
Based on server spec:

- Add /sign endpoint (Node or serverless)
- Replace local verify() with server proof
- Require:
  - hash match
  - Ed25519 signature verification

---

## Phase 4 — Trust Enforcement
- Block UI rendering if verification fails
- Add VerificationPanel
- Add status:
  - VERIFIED
  - INVALID
  - TAMPERED

---

## Phase 5 — Audit System
- Append-only log (localStorage → server later)
- Export proof.json

---

## Phase 6 — Repo Merge Strategy

### Option A (Recommended)
Monorepo:

/apps/web        → UI (current)
/apps/server     → signing endpoint
/packages/core   → omegaPipeline
/packages/verify → verification logic

### Option B
Keep separate repos:
- UI repo
- Verification service repo

---

## Phase 7 — CI / Determinism
- Lock Node >=20
- Add deterministic test
- Add hash consistency check

---

## Final State
System guarantees:

- Deterministic output
- Cryptographic verification
- Recurrence detection
- No false UI claims

---

## Command

> DECIDE → EXECUTE → VERIFY

No step skipped.
