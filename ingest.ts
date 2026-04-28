// ingest.ts
// Production-ready Databento ingestion with deterministic normalization

import { Historical } from "databento"
import fs from "fs-extra"
import path from "path"
import dotenv from "dotenv"

dotenv.config()

const client = new Historical(process.env.DATABENTO_API_KEY!)

// 🔒 deterministic stringify (critical for reproducibility)
function stableStringify(obj: any): string {
  return JSON.stringify(obj, Object.keys(obj).sort(), 2)
}

// 🔁 normalize into your engine signal format
function normalizeBar(bar: any) {
  return {
    ts: new Date(bar.ts_event).toISOString(),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume
  }
}

async function run() {
  const SYMBOL = "SPY"
  const DATASET = "XNAS.ITCH"   // US equities
  const SCHEMA = "ohlcv-1m"

  const START = "2024-01-01T00:00:00"
  const END   = "2024-01-02T00:00:00"

  console.log("🔄 Fetching data from Databento...")

  try {
    const data = await client.timeseries.get_range({
      dataset: DATASET,
      schema: SCHEMA,
      symbols: [SYMBOL],
      start: START,
      end: END
    })

    const records = data.toArray().map(normalizeBar)

    // 🧠 derive simple signals (plug into your MFCS pipeline)
    const signals = records.map((r, i) => {
      if (i === 0) return null

      const prev = records[i - 1]

      const momentum = r.close - prev.close
      const volatility = r.high - r.low

      return {
        ts: r.ts,
        symbol: SYMBOL,
        price: r.close,
        momentum,
        volatility,
        confidence: Math.min(1, Math.abs(momentum) / (volatility + 1e-6))
      }
    }).filter(Boolean)

    const output = {
      source: "databento",
      dataset: DATASET,
      symbol: SYMBOL,
      start: START,
      end: END,
      count: signals.length,
      signals
    }

    const outPath = path.join("data", `${SYMBOL}_${Date.now()}.json`)

    await fs.ensureDir("data")
    await fs.writeFile(outPath, stableStringify(output))

    console.log("✅ Saved:", outPath)
  } catch (error) {
    console.error("❌ Ingestion failed:", error)
    process.exit(1)
  }
}

run().catch(console.error)
