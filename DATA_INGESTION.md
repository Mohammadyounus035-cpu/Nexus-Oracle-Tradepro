# 🔱 Databento Data Ingestion System

Production-ready market data ingestion for NEXUS-Oracle-Tradepro. Pulls global market data with deterministic normalization for MFCS signal pipeline.

## 🌍 Supported Markets

| Market        | Dataset                 | Schema              |
| ------------- | ----------------------- | ------------------- |
| US Stocks     | `XNAS.ITCH`, `XNAS.SIP` | `ohlcv-1m`, `trades` |
| Futures (CME) | `GLBX.MDP3`             | `trades`, `ohlcv-1m` |
| Options       | `OPRA.PILLAR`           | `trades`            |
| Crypto        | `COINBASE`              | `trades`, `ohlcv-1m` |

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure API Key

Create `.env` in the workspace root:

```bash
DATABENTO_API_KEY=db-y4MysF5RWvh78R4fwX4KqJFHNLWMB
```

📌 Get your API key from: https://databento.com/

### 3. Run Ingestion

```bash
npm run ingest
```

Output saves to `data/SPY_<timestamp>.json` with normalized signals ready for MFCS pipeline.

---

## 📋 Types of Datasets

### XNAS (Nasdaq Level 2 Order Book)
```ts
dataset: "XNAS.ITCH"  // Full order book depth
schema: "ohlcv-1m"    // 1-minute OHLCV bars
symbols: ["AAPL", "MSFT", "SPY"]
```

### GLBX (CME Globex - Futures)
```ts
dataset: "GLBX.MDP3"
schema: "trades"
symbols: ["ES.FUT", "NQ.FUT"]  // E-mini S&P 500, Nasdaq 100
```

### Custom Multi-Asset Example
Edit `ingest.ts`:
```ts
const symbols = ["SPY", "NVDA", "TSLA", "ES.FUT"]
const dataset = ["XNAS.ITCH", "XNAS.ITCH", "XNAS.ITCH", "GLBX.MDP3"]
```

---

## 🔒 Deterministic Output

All ingested data uses **stable JSON ordering** (alphabetical keys) for:
- Reproducibility ✅
- Git diffs ✅
- Backtesting ✅
- Signal consistency ✅

Example output structure:
```json
{
  "count": 242,
  "dataset": "XNAS.ITCH",
  "signals": [
    {
      "confidence": 0.95,
      "momentum": 0.15,
      "price": 423.50,
      "symbol": "SPY",
      "ts": "2024-01-01T13:30:00.000Z",
      "volatility": 0.38
    }
  ],
  "source": "databento",
  "start": "2024-01-01T00:00:00",
  "symbol": "SPY"
}
```

---

## ⚙️ Configuration

### Modify Time Range

Edit `ingest.ts`:
```ts
const START = "2024-01-01T00:00:00"
const END   = "2024-01-31T23:59:59"
```

### Change Symbol/Dataset

```ts
const SYMBOL = "NVDA"           // Any ticker
const DATASET = "XNAS.ITCH"     // See table above
const SCHEMA = "ohlcv-1m"       // 1-minute bars
```

### Add New Signal Derivation

```ts
const signals = records.map((r, i) => {
  if (i === 0) return null
  
  const prev = records[i - 1]
  
  // Your custom signals here:
  const rsi = calculateRSI(records.slice(Math.max(0, i - 14), i))
  const macd = calculateMACD(records.slice(Math.max(0, i - 26), i))
  
  return {
    ts: r.ts,
    symbol: SYMBOL,
    price: r.close,
    rsi,
    macd,
    momentum: r.close - prev.close,
    volatility: r.high - r.low
  }
})
```

---

## 📡 GitHub Automation

The CI workflow (`.github/workflows/ingest.yml`) **automatically**:
- ✅ Runs ingestion every 30 minutes
- ✅ Commits data to GitHub
- ✅ Maintains full history
- ✅ Can be manually triggered

### Enable GitHub Automation

1. **Add API key as secret**:
   ```bash
   # In GitHub repo settings → Secrets
   DATABENTO_API_KEY = db-y4MysF5RWvh78R4fwX4KqJFHNLWMB
   ```

2. **Workflow triggers**:
   - Automatic: every 30 minutes
   - Manual: Actions → Data Ingestion → Run workflow

3. **Check results**:
   - `data/SPY_*.json` appears in `main` branch
   - Each file is timestamped and version-controlled

---

## 🔗 Integration with MFCS Pipeline

### Inside your NEXUS signal processor:

```ts
// Load ingested signals
const signalFile = await fetch("/data/SPY_latest.json")
  .then(r => r.json())

const signals = signalFile.signals

// Pass to MFCS engine
const loranthScore = mfcsOmega.evaluateSignals(signals, {
  momentum: 0.4,      // weight momentum 40%
  volatility: 0.3,    // weight volatility 30%
  confidence: 0.3     // weight confidence 30%
})

// Decision
if (loranthScore > THRESHOLD) {
  executeSignal(signals[signals.length - 1])
}
```

---

## 🧪 Local Testing

### Watch Mode (auto-restart)

```bash
npm run ingest:watch
```

### Dry Run (no file writes)

Edit `ingest.ts`, comment out:
```ts
// await fs.writeFile(outPath, stableStringify(output))
console.log("DRY RUN:", output)
```

### Check Generated Files

```bash
ls -la data/
cat data/SPY_*.json | jq .
```

---

## 📊 Data Quality Checks

Before using in production, validate:

```bash
# 1. Check file exists
test -f data/SPY_*.json && echo "✅ File created"

# 2. Validate JSON
jq empty data/SPY_*.json && echo "✅ Valid JSON"

# 3. Verify signal count
jq '.count' data/SPY_*.json

# 4. Check timestamps
jq '.signals | length' data/SPY_*.json
```

---

## 🛠️ Troubleshooting

### Error: "API key not found"
```bash
# Verify .env exists and has key
cat .env | grep DATABENTO_API_KEY
```

### Error: "401 Unauthorized"
- API key is expired or invalid
- Check Databento dashboard: https://app.databento.com/

### Error: "No data for date range"
- Dataset may not have data for that period
- Try different date or dataset
- Check: https://databento.com/docs/overview/

### Workflow not running?
- Verify secret `DATABENTO_API_KEY` exists in GitHub
- Check Actions tab for logs
- Manually trigger: Actions → Data Ingestion → Run workflow

---

## 📚 Resources

- **Databento Docs**: https://databento.com/docs/
- **API Reference**: https://databento.com/docs/api-reference/
- **Schemas**: https://databento.com/docs/schemas/

---

## ✅ Principles

This system maintains your NEXUS integrity:

- ✅ **Deterministic**: Same input → same output
- ✅ **Normalized**: All data converted to engine format
- ✅ **Replayable**: Full GitHub history for backtesting
- ✅ **Auditable**: Every ingestion is version-controlled
- ✅ **Decoupled**: API logic separate from signal logic

---

## 🔄 Next Steps

To extend:

1. **Multi-asset ingestion**: Loop over `SYMBOLS` array
2. **Real-time feed**: Use `db.Live()` for streaming
3. **Database storage**: Pipe to PostgreSQL + Timescale
4. **Signal scoring**: Add ML classifier to scored signals
5. **Alerting**: Webhook to Discord/Slack on anomalies

---

Generated: 2024-04-28  
Framework: NEXUS-Oracle-Tradepro  
Data Source: Databento
