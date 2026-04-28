// ingest-advanced.ts
// Extended example: Multi-asset ingestion with better error handling

import { Historical } from "databento"
import fs from "fs-extra"
import path from "path"
import dotenv from "dotenv"

dotenv.config()

const client = new Historical(process.env.DATABENTO_API_KEY!)

function stableStringify(obj: any): string {
  return JSON.stringify(obj, Object.keys(obj).sort(), 2)
}

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

// 📊 Multi-asset configuration
const INGESTION_CONFIGS = [
  {
    symbol: "SPY",
    dataset: "XNAS.ITCH",
    schema: "ohlcv-1m"
  },
  {
    symbol: "NVDA",
    dataset: "XNAS.ITCH",
    schema: "ohlcv-1m"
  },
  {
    symbol: "ES.FUT",
    dataset: "GLBX.MDP3",
    schema: "ohlcv-1m"
  }
]

async function ingestAsset(config: typeof INGESTION_CONFIGS[0]) {
  const START = "2024-01-01T00:00:00"
  const END = "2024-01-02T00:00:00"

  console.log(`📥 [${config.symbol}] Fetching from ${config.dataset}...`)

  try {
    const data = await client.timeseries.get_range({
      dataset: config.dataset,
      schema: config.schema,
      symbols: [config.symbol],
      start: START,
      end: END
    })

    const records = data.toArray().map(normalizeBar)

    // Derive signals
    const signals = records.map((r, i) => {
      if (i === 0) return null

      const prev = records[i - 1]
      const momentum = r.close - prev.close
      const volatility = r.high - r.low
      const return_pct = (momentum / prev.close) * 100

      return {
        ts: r.ts,
        symbol: config.symbol,
        price: r.close,
        momentum,
        volatility,
        return_pct,
        volume: r.volume,
        confidence: Math.min(1, Math.abs(return_pct) / (volatility / prev.close + 1e-6))
      }
    }).filter(Boolean)

    const output = {
      dataset: config.dataset,
      schema: config.schema,
      signals,
      source: "databento",
      start: START,
      symbol: config.symbol,
      timestamp: new Date().toISOString()
    }

    const outDir = path.join("data", "ingested")
    const outPath = path.join(outDir, `${config.symbol}_${Date.now()}.json`)

    await fs.ensureDir(outDir)
    await fs.writeFile(outPath, stableStringify(output))

    console.log(`✅ [${config.symbol}] Saved ${signals.length} signals → ${outPath}`)

    return output
  } catch (error) {
    console.error(`❌ [${config.symbol}] Failed:`, error)
    throw error
  }
}

async function runAll() {
  console.log("🔱 Multi-Asset Databento Ingestion\n")

  const results = []

  for (const config of INGESTION_CONFIGS) {
    try {
      const result = await ingestAsset(config)
      results.push(result)
    } catch (e) {
      console.warn(`⚠️  Continuing despite failure on ${config.symbol}`)
    }
  }

  // Aggregate summary
  const summary = {
    completed: results.length,
    total: INGESTION_CONFIGS.length,
    assets: results.map(r => ({
      symbol: r.symbol,
      signal_count: r.signals.length,
      price_range: [
        Math.min(...r.signals.map(s => s.price)),
        Math.max(...r.signals.map(s => s.price))
      ]
    })),
    timestamp: new Date().toISOString()
  }

  const summaryPath = path.join("data", `summary_${Date.now()}.json`)
  await fs.writeFile(summaryPath, stableStringify(summary))

  console.log("\n📊 Summary:")
  console.log(summary)
  console.log(`\n✅ Saved to: ${summaryPath}`)
}

runAll().catch(error => {
  console.error("Fatal error:", error)
  process.exit(1)
})
