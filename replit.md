# Nexus Oracle TradePro

Tron-inspired liquid-glass trading and market intelligence platform with 3D lattice visualizations.

## Architecture
- Frontend-only React + Vite app under `artifacts/nexus-oracle/`.
- Routing: wouter, six pages (Console, Lattice, TradePro, Markets, Codex, Mystic Map).
- Visuals: Three.js / @react-three/fiber / drei / postprocessing for 3D lattice; Recharts for market charts; framer-motion for entry animations; lucide-react for icons.
- Trading engine: in-memory `MockPriceGenerator` (GBM ticks every 1.5s for 8 stocks) + `PortfolioManager`, exposed via `MarketContext`.
- Theme: Tron palette (cyan #00d4ff, teal #00ffaa, magenta #ff00aa, amber #ffaa00, threshold red #ff4466) on dark navy bg, Orbitron / JetBrains Mono / Space Grotesk fonts.
- WebGLGuard component falls back gracefully when WebGL is unavailable.

## Files of note
- `src/App.tsx` — routes + providers
- `src/context/MarketContext.tsx` — live price + portfolio state
- `src/lib/marketData.ts` — price generator
- `src/lib/portfolio.ts` — order execution + positions
- `src/lib/analystRatings.ts` — synthetic analyst consensus
- `src/components/Lattice.tsx` (page) and `src/components/MiniLattice.tsx` — R3F 3D lattice
- `src/pages/*.tsx` — Console, Lattice, TradePro, Markets, Codex, MysticMap
