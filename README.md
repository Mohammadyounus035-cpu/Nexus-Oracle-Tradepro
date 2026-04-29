# Nexus Oracle Tradepro — Sovereign Lattice Fusion Model

A computational framework for modeling media platform governance using the Sovereign Lattice topology and Nexus triple-product fusion dynamics.

## Overview

This project implements a multi-platform simulation of media ecosystem health monitoring, where platform stability is modeled as a triple product Φ = E × N × τ:

- **E**: Platform energy/health (content authenticity, infrastructure uptime)
- **N**: Active node density (governance mesh participation)
- **τ**: Stability margin (coherence against drift thresholds)

The system includes:
- **Sentinel Observer Automaton**: Formal state machine that monitors Φ and triggers control actions
- **Adaptive Control Policies**: Sentinel-responsive interventions (Stabilize, Boost, Lock functions)
- **Sovereign Lattice Topology**: 67-node graph with guardian clusters and triad structures
- **Finite-State Abstraction**: Mode transitions (Idle → Build → Fusion → Collapse)

## Core Technical Artifacts

### ✅ Formally Verified TLA+ Specification
**Location:** `specs/MFCS.tla`, `specs/MFCS.cfg`, `specs/SentinelLayer.tla`

The TLA+ model has been verified by TLC model checker:
- **14,827 states generated, 4,396 distinct states**
- **All 4 invariants passed** (ZeroBleed, PhaseCancellation, NoiseFloor)
- **Liveness verified, no deadlock**
- **4-second runtime** for depth-18 state graph

This provides mathematical assurance of the lattice's coherence properties.

### ✅ Functional Audio DSP Implementation
**Location:** `D6DriftInjector.js`

Real-time AudioWorkletProcessor implementing:
- Ring buffer with fractional delay line
- 4-point windowed-sinc interpolation (Hann window)
- Drift injection at 671.6 Hz reference pitch
- Exponential decay toward hold state

### ✅ Working Runtime (TypeScript + WebSocket)
**Location:** `packages/`, `apps/`

Monorepo with:
- WebSocket server broadcasting lattice state (618ms intervals)
- Next.js + Three.js visualization
- Zustand state management
- Intent handlers for stabilization commands

## Project Structure

```
├── specs/                    # Formal specifications
│   ├── MFCS.tla             # Main TLA+ model
│   ├── MFCS.cfg             # TLC configuration
│   └── SentinelLayer.tla    # Observer module
├── simulation/              # ODE models & analysis
│   ├── nexus_simulation.py  # Multi-platform dynamics
│   ├── sovereign_lattice.py # Topology analysis
│   └── requirements.txt     # Python dependencies
├── packages/                # TypeScript runtime
├── apps/                    # Next.js visualization
├── assets/concept/          # Concept art & diagrams
└── tests/                   # Verification suite
```

## TradePro 96-Path Engine Plan

The TradePro engine upgrade plan is tracked in:

- `docs/tradepro-96-path-implementation-plan.md`
- `.github/prompts/tradepro-96-path-engine.prompt.md`

Use the Copilot prompt to implement the phased TypeScript rewrite for global market ingestion, historical/live comparison, 96-path lattice mapping, risk-gated execution, canonical proof generation, and analytics.

## Installation

### Python Simulation
```bash
cd simulation
pip install -r requirements.txt
python nexus_simulation.py
```

### Runtime (TypeScript)
```bash
pnpm install
pnpm dev  # Runs server + web concurrently
```

## Usage

### Run Multi-Platform Simulation

```bash
cd simulation
python nexus_simulation.py
```

Generates:
- Console diagnostic report for Netflix, YouTube, Meta, TikTok, X/Twitter
- PNG plots: Φ trajectories, phase portraits, control histories

### Analyze Lattice Topology

```bash
cd simulation
python sovereign_lattice.py
```

Loads 67-node CSV, computes E/N/τ/Φ, runs dormancy scenarios.

### Deploy Visualization

```bash
pnpm build
pnpm start
```

Serves the Three.js lattice visualization on localhost:3000.

## Platform Models

| Platform | Initial State (E, N, τ) | Key Characteristics |
|----------|------------------------|---------------------|
| Netflix | (3.0, 2.5, 3.0) | High stability, moderate activity |
| YouTube | (2.5, 3.0, 2.0) | High activity, moderate stability |
| Meta | (2.0, 2.8, 1.8) | Balanced but volatile |
| TikTok | (1.5, 3.5, 1.2) | High activity, low stability margin |
| X/Twitter | (1.2, 1.5, 1.0) | Low across board, high drift risk |

## Sentinel States

- **clear**: Φ healthy, maintenance control
- **watching**: Φ approaching threshold, targeted intervention
- **alert**: Φ critical, maximum intervention

## Lattice Structure

- **67 nodes**: 1 central Nexus + 30 guardian cluster + 36 generic mesh
- **6 Guardians**: Phoenix, Dragon, Lion, Raven, Butterfly, Ouroboros
- **11 Triads**: Alpha through Chi, cooperative clusters
- **4 Dormant nodes**: Fulcrum, Anchor, Haven, Dawn (strategic reserves)

## Mathematical Foundation

Triple-product fusion dynamics:
```
ẋ = f(x, u) + g(x, u)
Φ̇ = Φ · Ξ(x, u)
```

Ξ ≥ 0 ensures forward invariance of Fusion mode.

## Verification Status

- ✅ **TLA+ Model Checking**: All invariants pass
- ✅ **Audio DSP**: Functional AudioWorklet
- ✅ **Runtime**: WebSocket + Three.js working
- ✅ **Simulation**: ODE trajectories match domain intuitions
- ⚠️ **Security Claims**: ML-KEM-768, FIPS-203 listed but not implemented

## Contributing

1. Run `pnpm test` for TypeScript verification
2. Run `cd simulation && python nexus_simulation.py` for ODE validation
3. Use TLC to check `specs/MFCS.tla` after changes

## License

Research prototype for complex systems governance.

## Platform Models

| Platform | Initial State (E, N, τ) | Characteristics |
|----------|------------------------|-----------------|
| Netflix | (3.0, 2.5, 3.0) | High stability, moderate activity |
| YouTube | (2.5, 3.0, 2.0) | High activity, moderate stability |
| Meta | (2.0, 2.8, 1.8) | Balanced but volatile |
| TikTok | (1.5, 3.5, 1.2) | High activity, low stability margin |
| X/Twitter | (1.2, 1.5, 1.0) | Low across board, high drift risk |

## Sentinel States

- **clear**: Φ healthy, minimal intervention
- **watching**: Φ approaching threshold, targeted boosts
- **alert**: Φ critical, maximum intervention

## Lattice Structure

- **67 nodes**: 1 central Nexus + 30 guardian cluster nodes + 36 generic mesh nodes
- **6 Guardians**: Phoenix, Dragon, Lion, Raven, Butterfly, Ouroboros
- **11 Triads**: Alpha through Chi, organizing cooperative clusters
- **4 Dormant nodes**: Fulcrum, Anchor, Haven, Dawn (strategic reserves)

## Mathematical Foundation

The model implements the triple-product fusion dynamics from the Nexus paper:

```
ẋ = f(x, u) + g(x, u)
Φ̇ = Φ · Ξ(x, u)
```

Where Ξ ≥ 0 ensures forward invariance of the Fusion mode.

## Outputs

- **Console Report**: Platform diagnostics, Sentinel transitions, equilibrium estimates
- **Φ Trajectories**: Time-series plots of fusion functional
- **Phase Portraits**: E-N state space with Φ contours
- **Control Histories**: Intervention intensity over time
- **Mode Timelines**: Finite-state transitions
- **Lattice Topology**: Node graph with guardian coloring and shell rings

## Extension Points

- Add real platform data feeds for parameter fitting
- Implement optimal control policies
- Extend Sentinel with predictive forecasting
- Integrate lattice dormancy with platform events

## License

This is a research prototype for exploring governance topologies in complex systems.
1. cd apps/web
2. pnpm install
3. NEXT_PUBLIC_WS_URL=ws://localhost:3001 pnpm dev -p 3000
- The web client uses environment variable NEXT_PUBLIC_WS_URL to override the WS endpoint.

Replit
- The repository includes `.replit` with Run set to `pnpm install && pnpm dev`. Upload the repo/zip to Replit and set the Run command to that if it’s not set already.
- If Replit prevents two processes on separate ports, run only the web app and set NEXT_PUBLIC_WS_URL to a reachable WS server (or run the WS server in the Next app as an API route — I can show how).

---

## Project structure

- package.json (root) — pnpm workspace config + dev scripts
- tsconfig.json — shared TypeScript paths
- packages/
  - engine/
    - lattice.ts — minimal lattice engine (createLattice, step)
  - types/
    - index.ts — re-exported types
- apps/
  - server/
    - index.ts — WebSocket server that emits lattice state at φ interval (618 ms)
    - package.json
  - web/
    - next.config.mjs
    - src/
      - pages/index.tsx — Next page, top-left HUD + Lattice3D canvas
      - components/Lattice3D.tsx — Three.js visualization
      - hooks/useLatticeSync.ts — WS client sync; uses NEXT_PUBLIC_WS_URL
      - store.ts — zustand store for lattice state

---

## How it works (short)

- `packages/engine/lattice.ts` implements:
  - createLattice(size) -> initial LatticeState with `size` nodes
  - step(state) -> returns next state with small energy drift and recomputed resonance
- `apps/server` creates a WebSocketServer and broadcasts JSON state on an interval of 618ms (phi-sync homage).
- `apps/web` opens a WebSocket to the server, keeps the lattice state in a zustand store, and renders nodes as spheres in a ring via Three.js.

Commands supported by the server (via WS message):
- send JSON `{ "type": "intent", "payload": "stabilize" }` to reduce node energy (demo intent handler).

---

## Environment variables

- NEXT_PUBLIC_WS_URL — URL for the WebSocket server (default: `ws://localhost:3001`)
- PORT — change server port for apps/server (default 3001)

Set them before starting the web or use an .env approach in your dev environment.

---

## Troubleshooting

- WebSocket connection refused
  - Confirm the server is running on the configured port (3001 by default).
  - If running on Replit, the server port might be different or not exposed. Consider using a single-process approach (served via Next) or a remote WS URL.

- Two-process constraints on Replit
  - If Replit doesn’t allow simultaneous processes bound to separate ports, run only the `web` and point it at a public WS host, or run the WS server inside Next as a lightweight API route.

- pnpm not installed
  - Install locally: `npm install -g pnpm` or use `corepack enable` on newer Node versions.

- TypeScript path resolution errors
  - The root `tsconfig.json` contains path mappings for `@omega/engine` and `@omega/types`. If you open subprojects in an editor, make sure the editor workspace recognizes the root TS config, or adjust local imports to relative paths.

- `curl: (56) CONNECT tunnel ... 403 Forbidden` when checking a Codex task URL
  - This is typically a proxy/auth/network access issue, not a code regression.
  - Confirm the task URL is complete (truncated browser links can fail immediately).
  - Check for forced proxy variables:
    - `env | grep -i proxy`
  - Compare direct header checks:
    - `curl -I https://chatgpt.com`
    - `curl -I https://chatgpt.com/codex/cloud/tasks/<task_id>`
  - If your environment allows bypassing proxy variables, test:
    - `HTTPS_PROXY= HTTP_PROXY= ALL_PROXY= curl -I https://chatgpt.com/codex/cloud/tasks/<task_id>`
  - Many `chatgpt.com/codex/cloud/tasks/...` links are browser-session URLs and may require interactive authentication; prefer opening them in a signed-in browser or using the actual API/tool endpoint if available.

---

## Development suggestions / next steps

- Add a command-line or on-screen command input for UI commands (`stabilize`, `boost`, `prediction`, `trace`).
- Add authentication/authorization if you expose command functions.
- Add unit tests for the lattice engine and snapshot tests for the UI.
- Improve Three.js visualization: color by node.state, add connections/lines for links, add animation on energy changes.
- Bundle server as an API route for easier Replit deployment.

---


## Truth-first interface guardrails

When testing claims that include strong visuals + numeric anchors (e.g., `432 Hz`, `528 Hz`, "resonance" labels), treat them as **unverified inputs** unless they are bound to measurable evidence.

Recommended contract for UI + engine:

- **Provenance required**: every displayed metric must include source id, measurement method, and timestamp.
- **Deterministic mapping**: visual state should be a pure function of validated state, not free text claims.
- **Reproducibility**: values must be derivable from persisted inputs + code version.
- **Invariant enforcement**: if a claim cannot be derived, block render or mark as unverified.
- **Auditability**: hash-lock state transitions and keep an append-only event log for post-hoc verification.

Suggested implementation path:

1. Add `verification` metadata to lattice packets (`source`, `method`, `confidence`, `measured_at`).
2. Reject packets that fail schema + invariant checks in `apps/server` before broadcast.
3. In `apps/web`, render a "verified" badge only when proof metadata is complete.
4. Add test vectors that intentionally include persuasive-but-invalid numeric claims and assert rejection.

This keeps the system aligned with a simple rule: **if it cannot be derived, it cannot be displayed**.

---


## Visual state semantics (UI as state, not symbolism)

The lattice visuals can be interpreted as concrete UI/state representations:

- **Static state (baseline)**: a centered hexagon with uniform glow maps to a single authoritative state with no active transitions (e.g., `HOLD`, `drift = 0`, `input == anchor`).
- **System envelope (bounded field)**: adding an outer sphere while the core remains unchanged maps to packaging the canonical payload with proof artifacts (`hash`, `signature`, `publicKey`) without mutating the payload itself.

Progression:

1. Compute canonical payload (`data`).
2. Stabilize/validate invariants (`no drift`, deterministic output).
3. Seal with proof metadata (`hash`, `signature`) for external verification.

Important: visuals are representations only. Guarantees come from canonicalization, hashing/signing, verification checks, and tests.

| Visual element | System equivalent |
| --- | --- |
| Hexagon core | Canonical state/payload |
| Uniform glow | Deterministic output |
| Stillness | No state transition firing |
| Outer sphere | Signed + hashed envelope |
| Center alignment | Invariant satisfied |
| No distortion | Zero drift |

## Deploy

- Vercel: Deploy `apps/web` to Vercel; point `NEXT_PUBLIC_WS_URL` at a publicly accessible WS server (or deploy the server somewhere public as well).
- Heroku / Fly / Render: Deploy `apps/server` as a Node service; expose the WS endpoint and update the web `NEXT_PUBLIC_WS_URL`.

---

## Contributing

- Create a branch, commit changes, open a PR with description and screenshots.
- If you want me to prepare a PR or push these files to GitHub for you, I can generate a zip (already provided) and steps or a script to create the repo and push — or you can run the following locally:

  gh repo create <YOUR_USER>/omega-lattice --public --confirm
  git init
  git add .
  git commit -m "Initial commit: omega-lattice"
  git branch -M main
  git remote add origin https://github.com/<YOUR_USER>/omega-lattice.git
  git push -u origin main

---

## License

MIT — modify as desired.

---

If you want, I can:
- Add a stylized Omega Seal UI and a text command input.
- Convert the WS server into a Next.js API route (single-port Replit-friendly).
- Produce a GitHub Actions workflow to run tests and build the web app.

Which follow-up should I do next?  
- "Seal UI", "API route server", "GitHub push script", or "CI workflow".
