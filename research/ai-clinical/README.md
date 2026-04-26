# 🧠 AI in Clinical Practice — Research Module

## Purpose
This module formalizes research artifacts into a **deterministic, verifiable, and extensible structure** aligned with the Omega system.

## Structure

```
research/
  ai-clinical/
    README.md
    sources/
    analyses/
    artifacts/
    schemas/
```

## Directories

### sources/
Raw papers, FDA summaries, datasets

### analyses/
Structured breakdowns (like the FDA sweep)

### artifacts/
Signed, hash-verified outputs (oracle-proof-*.json)

### schemas/
JSON schemas for validation

## Rules

- No floating-point ambiguity
- All outputs must be reproducible
- All artifacts must be signed + verifiable
- No claim without source linkage

## Integration

Each analysis can be:
1. Parsed → structured JSON
2. Hashed → SHA-256
3. Signed → Ed25519
4. Verified → external audit UI

---

## Status
Ready for continuous ingestion + verification
