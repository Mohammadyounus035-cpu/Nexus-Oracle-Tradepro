// examples/databento-mfcs-example.ts
// Complete example: Ingest Databento data and feed to MFCS oracle

import {
  loadLatestSignals,
  prepareMFCSInput,
  evaluateWithMFCS,
  MFCSEvaluationResult
} from "../src/integration/databento-mfcs-bridge"

/**
 * Example 1: Single Symbol Evaluation
 */
async function example1_SingleSymbol() {
  console.log("📌 EXAMPLE 1: Single Symbol (SPY)")
  console.log("─".repeat(50))

  try {
    const result = await evaluateSymbol("SPY")
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error("❌", error)
  }
}

/**
 * Example 2: Portfolio Evaluation
 */
async function example2_Portfolio() {
  console.log("\n📌 EXAMPLE 2: Portfolio (SPY + NVDA + ES.FUT)")
  console.log("─".repeat(50))

  const portfolio = ["SPY", "NVDA", "ES.FUT"]
  const results: MFCSEvaluationResult[] = []

  for (const symbol of portfolio) {
    try {
      const result = await evaluateSymbol(symbol)
      results.push(result)
      console.log(`✅ ${symbol}: ${result.decision} (score: ${result.score.toFixed(3)})`)
    } catch (error) {
      console.log(`⚠️  ${symbol}: Skipped (${error})`)
    }
  }

  // Aggregate portfolio decision
  const buyCount = results.filter(r => r.decision === "BUY").length
  const sellCount = results.filter(r => r.decision === "SELL").length
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length

  console.log("\n📊 Portfolio Summary:")
  console.log(`   Buy signals: ${buyCount}/${results.length}`)
  console.log(`   Sell signals: ${sellCount}/${results.length}`)
  console.log(`   Average score: ${avgScore.toFixed(3)}`)

  return { results, portfolio: { buy: buyCount, sell: sellCount, avg: avgScore } }
}

/**
 * Example 3: Custom Weights
 */
async function example3_CustomWeights() {
  console.log("\n📌 EXAMPLE 3: Custom Weights (High Confidence)")
  console.log("─".repeat(50))

  try {
    const ingestion = await loadLatestSignals("SPY")

    // Conservative: prioritize confidence
    const weights = {
      momentum: 0.2,
      volatility: 0.2,
      confidence: 0.6
    }

    const mfcsInput = prepareMFCSInput(ingestion, weights)
    const result = evaluateWithMFCS(mfcsInput)

    console.log(`✅ SPY (Confidence-Heavy): ${result.decision}`)
    console.log(`   Score: ${result.score.toFixed(4)}`)
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(2)}%`)
  } catch (error) {
    console.error("❌", error)
  }
}

/**
 * Example 4: Streaming Updates (Simulated)
 */
async function example4_StreamingUpdates() {
  console.log("\n📌 EXAMPLE 4: Simulated Streaming (Poll every 30s)")
  console.log("─".repeat(50))

  const symbol = "SPY"
  let iteration = 0
  const maxIterations = 3

  const interval = setInterval(async () => {
    try {
      iteration++
      console.log(`\n[${new Date().toISOString()}] Poll #${iteration}`)

      const result = await evaluateSymbol(symbol)
      console.log(`${symbol}: ${result.decision} (score: ${result.score.toFixed(3)})`)

      if (iteration >= maxIterations) {
        clearInterval(interval)
        console.log("\n✅ Streaming example complete")
      }
    } catch (error) {
      console.error("Poll error:", error)
    }
  }, 5000) // Poll every 5 seconds for demo
}

/**
 * Helper: Evaluate single symbol
 */
async function evaluateSymbol(symbol: string): Promise<MFCSEvaluationResult> {
  const ingestion = await loadLatestSignals(symbol)

  const weights = {
    momentum: 0.4,
    volatility: 0.3,
    confidence: 0.3
  }

  const mfcsInput = prepareMFCSInput(ingestion, weights)
  return evaluateWithMFCS(mfcsInput)
}

/**
 * Main: Run all examples
 */
async function main() {
  console.log("🔱 DATABENTO → MFCS ORACLE EXAMPLES")
  console.log("═".repeat(50))

  const exampleNumber = process.argv[2] || "1"

  switch (exampleNumber) {
    case "1":
      await example1_SingleSymbol()
      break
    case "2":
      await example2_Portfolio()
      break
    case "3":
      await example3_CustomWeights()
      break
    case "4":
      await example4_StreamingUpdates()
      break
    default:
      console.log("Usage: npx ts-node examples/databento-mfcs-example.ts [1|2|3|4]")
      console.log("  1: Single symbol evaluation")
      console.log("  2: Portfolio multi-symbol")
      console.log("  3: Custom weights")
      console.log("  4: Streaming updates (simulated)")
  }
}

main().catch(console.error)
