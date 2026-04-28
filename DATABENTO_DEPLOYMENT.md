// 🚀 DATABENTO PRODUCTION DEPLOYMENT GUIDE

## Overview

This guide covers deploying the Databento ingestion system in production with:
- ✅ Continuous data collection
- ✅ Automated MFCS evaluation  
- ✅ Error recovery
- ✅ Monitoring & alerting
- ✅ Audit trails

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   DATABENTO API                         │
└─────────────────┬───────────────────────────────────────┘
                  │ (market data)
┌─────────────────▼───────────────────────────────────────┐
│            ingest.ts / ingest-advanced.ts               │
│     - Normalize to deterministic JSON                   │
│     - Stable ordering (reproducible)                    │
└─────────────────┬───────────────────────────────────────┘
                  │ (signals)
        ┌─────────▼────────────┐
        │   data/SPY_*.json    │
        │  (Git-versioned)     │
        └─────────┬────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│      databento-mfcs-bridge.ts                           │
│     - Load ingested signals                             │
│     - Evaluate with MFCS oracle                         │
│     - Generate trading decisions                        │
└─────────────────┬───────────────────────────────────────┘
                  │ (decisions)
        ┌─────────▼────────────┐
        │ BUY / SELL / HOLD    │
        │ (with confidence)    │
        └──────────────────────┘
```

---

## 1️⃣ LOCAL SETUP

### Requirements
- Node.js 20+
- npm/pnpm
- Databento API key
- GitHub repo access

### Installation

```bash
# Clone repo
git clone https://github.com/Mohammadyounus035-cpu/Nexus-Oracle-Tradepro.git
cd Nexus-Oracle-Tradepro

# Install
pnpm install

# Configure
cp .env.example .env
# Edit .env with your DATABENTO_API_KEY
```

### Test Locally

```bash
# Single run
npm run ingest

# Watch mode (auto-restart)
npm run ingest:watch

# Advanced multi-asset
npx ts-node ingest-advanced.ts

# Verify output
ls data/
jq . data/SPY_*.json
```

---

## 2️⃣ GITHUB ACTIONS AUTOMATION

### Setup CI/CD

1. **Add secret to GitHub**:
   ```bash
   # In repo settings → Secrets and variables → Actions
   Name: DATABENTO_API_KEY
   Value: db-y4MysF5RWvh78R4fwX4KqJFHNLWMB
   ```

2. **Verify workflow file**:
   - Location: `.github/workflows/ingest.yml`
   - Triggers: Every 30 minutes + manual
   - Commits: data/ directory to main

3. **Test workflow**:
   - GitHub UI → Actions → Data Ingestion
   - Click "Run workflow" → trigger manually
   - Check logs for success/failure

### Check Results

```bash
# View ingestion history
git log --oneline --all -- data/

# Pull latest data
git pull origin main

# View latest file
jq . data/SPY_*.json | head -30
```

---

## 3️⃣ PRODUCTION MONITORING

### Log All Runs

```bash
# View workflow runs
gh run list -w ingest.yml --repo Mohammadyounus035-cpu/Nexus-Oracle-Tradepro

# Get details of last run
gh run view --repo Mohammadyounus035-cpu/Nexus-Oracle-Tradepro

# Download logs
gh run download <run_id> --repo Mohammadyounus035-cpu/Nexus-Oracle-Tradepro
```

### Alert on Failures

Add to `.github/workflows/ingest.yml`:

```yaml
  - name: Notify on failure
    if: failure()
    run: |
      echo "❌ Data ingestion failed"
      # Add your notification (Slack, Discord, email)
```

---

## 4️⃣ MFCS ORACLE INTEGRATION

### Load and Evaluate

```bash
# Single symbol
npx ts-node src/integration/databento-mfcs-bridge.ts SPY

# Portfolio
npx ts-node examples/databento-mfcs-example.ts 2

# Custom weights
npx ts-node examples/databento-mfcs-example.ts 3
```

### API Endpoint Example

```ts
// apps/server/src/routes/oracle.ts

import express from "express"
import { evaluateSymbol } from "../../../src/integration/databento-mfcs-bridge"

const router = express.Router()

router.get("/oracle/signal/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params
    const signal = await evaluateSymbol(symbol)
    
    res.json({
      status: "success",
      data: signal,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    })
  }
})

export default router
```

---

## 5️⃣ BACKTESTING

### Replay Historical Data

```bash
# List all ingested files
ls -la data/

# Convert to backtest format
npx ts-node scripts/prepare-backtest.ts data/SPY_*.json

# Run backtest
npm run backtest:advanced -- --symbols SPY --start 2024-01-01
```

---

## 6️⃣ DISASTER RECOVERY

### Data Backup

```bash
# Backup before manual changes
cp -r data/ data.backup_$(date +%s)/

# Restore from git history
git restore data/
# or
git checkout <commit> -- data/
```

### Failure Recovery

| Scenario | Fix |
|----------|-----|
| API key expired | Update `DATABENTO_API_KEY` in GitHub secrets |
| Ingestion fails | Check Actions logs; manual trigger retry |
| Data corruption | `git checkout HEAD~1 -- data/` |
| Git push fails | Check permissions; rebase and force push |

---

## 7️⃣ SCALING

### Multi-Market Expansion

Currently supports:
- ✅ US Equities (XNAS)
- ✅ US Futures (GLBX)
- ⏳ Options (OPRA) - requires account upgrade
- ⏳ Crypto (COINBASE) - requires account upgrade

### Scale Strategy

1. **Week 1**: SPY (1 ingest/day) ← Safe test
2. **Week 2**: Add NVDA, TSLA (3 assets × 288/day)
3. **Month 2**: Add ES.FUT, NQ.FUT (5 assets × 288/day)
4. **Month 3**: Full portfolio + real-time (20+ assets × 288/day)

---

## 8️⃣ COST OPTIMIZATION

### Databento Pricing

| Plan | Price | Includes |
|------|-------|----------|
| Starter | $100/mo | 1M records/mo |
| Standard | $500/mo | 25M records/mo |
| Enterprise | Custom | Unlimited |

### Estimate Usage

```
SPY 1-min bars:
- 6.5 hours × 60 min = 390 bars/day
- 390 × 20 trading days = 7,800 bars/month

1 asset @ 1-min: ~7.8K records/mo
5 assets: ~39K records/mo (fits Starter plan)
```

### Cost Reduction

- ⏸️ Run ingestion only during market hours
- 🎯 Sample: 5-min bars instead of 1-min (5× savings)
- 💾 Archive old data to cold storage monthly

---

## 9️⃣ COMPLIANCE & AUDITING

### Version Control

Every ingestion is timestamped + git-committed:

```bash
git log --oneline -- data/ | head -20
```

Output:
```
a1f2c3d chore: automated data ingestion (SPY @ 14:30 UTC)
b2e3f4d chore: automated data ingestion (SPY @ 14:00 UTC)
c3d4e5f chore: automated data ingestion (SPY @ 13:30 UTC)
```

### Audit Trail

```bash
# Who changed data?
git log -p -- data/SPY_*.json | grep "^Author\|^Date"

# What exactly changed?
git diff HEAD~1 HEAD -- data/
```

---

## 🔟 TROUBLESHOOTING

| Error | Solution |
|-------|----------|
| `API key invalid` | Verify key in .env and GitHub secrets |
| `No data for date` | Check Databento has data for that dataset/date |
| `Workflow timeout` | Reduce symbol count; increase workflow timeout |
| `Git push blocked` | Check branch protection; use personal token |
| `Out of memory` | Split into smaller date ranges; sample data |

---

## 🎯 CHECKPOINT

Before going live:

- [ ] Local ingestion works (`npm run ingest`)
- [ ] .env has valid DATABENTO_API_KEY
- [ ] GitHub secret `DATABENTO_API_KEY` set
- [ ] Workflow runs successfully (manual trigger)
- [ ] Data commits appear on GitHub
- [ ] MFCS bridge loads signals correctly
- [ ] Oracle generates decisions without errors
- [ ] Backtest data pipeline works

---

## 📚 References

- Databento Docs: https://databento.com/docs/
- GitHub Actions: https://docs.github.com/en/actions
- Our Integration: [databento-mfcs-bridge.ts](../src/integration/databento-mfcs-bridge.ts)
- Examples: [databento-mfcs-example.ts](../examples/databento-mfcs-example.ts)

---

**Status**: ✅ Ready for Production  
**Last Updated**: 2024-04-28  
**Maintainer**: NEXUS-Oracle Team
