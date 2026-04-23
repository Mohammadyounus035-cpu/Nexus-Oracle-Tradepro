# nexus-core

State-authoritative, deterministic core engine for Nexus behaviors.

## Scripts

- `npm run build` - Compile TypeScript
- `npm run dev` - Run demo loop with tsx
- `npm run start` - Run built demo from `dist`
- `npm test` - Execute tests with Vitest
- `npm run analyze` - Run full graph analysis and export `analysis.json`
- `./run.sh` - Install deps, regenerate `analysis.json`, write `analysis.sha256`, and verify checksum

## Reproducible artifact verification

```bash
cd nexus-core
./run.sh
sha256sum -c analysis.sha256
```

Optional provenance verification:

```bash
gpg --verify analysis.sha256.asc analysis.sha256
```

## Unified analysis pipeline

```ts
const nodes = parseNodeMap("./data/node_map.csv");
const analysis = runFullAnalysis(nodes);
exportAnalysis(analysis);
```

```py
analysis = load_analysis()
visualize_full_system(analysis)
```

Python glue helpers live in `python/visualize_full_system.py`.
