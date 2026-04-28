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
- `src/App.tsx` — routes + providers (mounts AlertOverlay globally)
- `src/context/MarketContext.tsx` — live price + portfolio + alerts + custom symbols
- `src/lib/marketData.ts` — `MockPriceGenerator` with `addStock` / `removeStock`
- `src/lib/portfolio.ts` — order execution + positions
- `src/lib/analystRatings.ts` — synthetic analyst consensus
- `src/lib/alerts.ts` — `AlertManager` (per-symbol price-cross detection, persists to `localStorage` key `nexus.alerts.v1`)
- `src/lib/customSymbols.ts` — custom-ticker persistence (`nexus.customSymbols.v1`)
- `src/lib/newsFeed.ts` — synthetic news headline generator (8 categories)
- `src/components/Lattice.tsx` (page) and `src/components/MiniLattice.tsx` — R3F 3D lattice
- `src/components/NewsTicker.tsx` — scrolling news marquee under the header
- `src/components/AddTickerDialog.tsx` — modal to register a new simulated symbol
- `src/components/AlertsPanel.tsx` — per-symbol alert arm/list/remove panel on TradePro
- `src/components/AlertOverlay.tsx` — toast notifications when an alert crosses
- `src/pages/*.tsx` — Console, Lattice, TradePro, Markets, Codex, MysticMap
