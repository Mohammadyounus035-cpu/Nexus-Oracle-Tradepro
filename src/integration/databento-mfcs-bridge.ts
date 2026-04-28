// src/integration/databento-mfcs-bridge.ts
// Bridge between Databento ingested signals and MFCS evaluation engine

import fs from "fs-extra"
import path from "path"

export interface DatabentoSignal {
  ts: string
  symbol: string
  price: number
  momentum: number
  volatility: number
  confidence: number
}

export interface IngestionOutput {
  source: string
  dataset: string
  symbol: string
  start: string
  end: string
  count: number
  signals: DatabentoSignal[]
}

export interface MFCSEvaluationInput {
  symbol: string
  signals: DatabentoSignal[]
  weights: {
    momentum: number
    volatility: number
    confidence: number
  }
}

export interface MFCSEvaluationResult {
  symbol: string
  score: number
  decision: "BUY" | "SELL" | "HOLD"
  confidence: number
  reasoning: string
}

/**
 * Load latest ingested signals for a symbol
 */
export async function loadLatestSignals(symbol: string): Promise<IngestionOutput> {
  const dataDir = path.join(process.cwd(), "data")
  const files = await fs.readdir(dataDir)

  const symbolFiles = files
    .filter(f => f.startsWith(symbol) && f.endsWith(".json"))
    .sort()
    .reverse()

  if (symbolFiles.length === 0) {
    throw new Error(`No ingested data found for symbol: ${symbol}`)
  }

  const latestFile = path.join(dataDir, symbolFiles[0])
  return fs.readJSON(latestFile)
}

/**
 * Bridge: Convert Databento signals to MFCS evaluation input
 */
export function prepareMFCSInput(
  ingestion: IngestionOutput,
  weights: MFCSEvaluationInput["weights"]
): MFCSEvaluationInput {
  return {
    symbol: ingestion.symbol,
    signals: ingestion.signals,
    weights
  }
}

/**
 * Evaluate using MFCS principles
 * (Placeholder - integrate with actual MFCS oracle)
 */
export function evaluateWithMFCS(input: MFCSEvaluationInput): MFCSEvaluationResult {
  const signals = input.signals
  if (signals.length === 0) {
    return {
      symbol: input.symbol,
      score: 0,
      decision: "HOLD",
      confidence: 0,
      reasoning: "No signals available"
    }
  }

  // Calculate weighted composite score
  const latestSignals = signals.slice(-5) // Last 5 candles
  const avgMomentum = latestSignals.reduce((sum, s) => sum + s.momentum, 0) / latestSignals.length
  const avgVolatility = latestSignals.reduce((sum, s) => sum + s.volatility, 0) / latestSignals.length
  const avgConfidence = latestSignals.reduce((sum, s) => sum + s.confidence, 0) / latestSignals.length

  const weightedScore =
    Math.tanh(avgMomentum / 10) * input.weights.momentum +
    (2 / (1 + Math.exp(-avgVolatility))) - 1 * input.weights.volatility +
    avgConfidence * input.weights.confidence

  const normScore = Math.tanh(weightedScore) // Normalize to [-1, 1]

  // Decision logic
  let decision: "BUY" | "SELL" | "HOLD" = "HOLD"
  let confidence = Math.abs(normScore)

  if (normScore > 0.2 && avgConfidence > 0.6) {
    decision = "BUY"
  } else if (normScore < -0.2 && avgConfidence > 0.6) {
    decision = "SELL"
  }

  return {
    symbol: input.symbol,
    score: normScore,
    decision,
    confidence,
    reasoning: `
      Composite MFCS Score: ${normScore.toFixed(4)} / 1.0
      - Momentum: ${avgMomentum.toFixed(4)} (weight: ${input.weights.momentum * 100}%)
      - Volatility: ${avgVolatility.toFixed(4)} (weight: ${input.weights.volatility * 100}%)
      - Confidence: ${avgConfidence.toFixed(4)} (weight: ${input.weights.confidence * 100}%)
      - Decision Threshold: ${(decision === "BUY" ? ">0.2" : decision === "SELL" ? "<-0.2" : "[-0.2, 0.2]")}
    `.trim()
  }
}

/**
 * Example: Main integration flow
 */
export async function runMFCSEvaluation(symbol: string) {
  console.log(`🔄 [${symbol}] Loading ingested data...`)

  const ingestion = await loadLatestSignals(symbol)
  console.log(`📊 Found ${ingestion.count} signals from ${ingestion.dataset}`)

  const weights = {
    momentum: 0.4,
    volatility: 0.3,
    confidence: 0.3
  }

  const mfcsInput = prepareMFCSInput(ingestion, weights)
  const result = evaluateWithMFCS(mfcsInput)

  console.log(`\n✅ MFCS Evaluation Result:`)
  console.log(`   Symbol: ${result.symbol}`)
  console.log(`   Decision: ${result.decision}`)
  console.log(`   Score: ${result.score.toFixed(4)}`)
  console.log(`   Confidence: ${(result.confidence * 100).toFixed(2)}%`)
  console.log(`\nReasoning:\n${result.reasoning}`)

  return result
}

// Export for use in CLI or API endpoints
if (require.main === module) {
  const symbol = process.argv[2] || "SPY"
  runMFCSEvaluation(symbol).catch(console.error)
}
