# Chorus Stack Monorepo Starter

This runnable starter organizes the Control Kernel and RTTS simulation components into a lightweight monorepo.

## Layout

- `packages/shared-types`: protocol and domain types used across components.
- `packages/control-kernel`: mode evaluation and assignment policy selection.
- `packages/assignment-engine`: constrained batch assignment algorithm.
- `packages/chorus-core`, `packages/sap-engine`, `packages/rtts-evidence`: interface contracts.
- `tests`: lightweight Control Kernel spec.
- `simulations`: baseline RTTS scenarios plus a medical HITL threshold/cost sweep simulator.

## Quick start

```bash
npm install
npm test
npm run build
python3 simulations/rtts_simulation.py
python3 simulations/medical_hitl_threshold_simulation.py
```

## Deployment note

- For Vercel-compatible realtime allocator progress streaming (SSE), see `docs/VERCEL_SSE_MIGRATION.md`.
- For safe Browserbase session bootstrapping in Python/Node without hardcoding credentials, see `docs/BROWSERBASE_QUICKSTART.md`.
