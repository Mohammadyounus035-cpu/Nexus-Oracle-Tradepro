# HFCE

HFCE is a TypeScript runtime for a coherence-governed, symbolically controlled state machine.

## Core ideas

- State is bounded by invariants
- Instructions mutate state through one authorized path
- Faults are classified, not ignored
- Every meaningful mutation is followed by observation and mirror inspection
- Adaptation is bounded and can be frozen

## Initial structure

- `src/core` — laws and pure logic
- `src/engine` — runtime orchestration
- `tests` — verification
- `examples` — runnable references

## Commands

```bash
npm install
npm run check
npm run test
npm run dev
```
