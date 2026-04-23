import fs from "node:fs";
import type { FullAnalysis } from "./pipeline.js";

export function exportAnalysis(analysis: FullAnalysis, outputPath = "./analysis.json"): void {
  const payload = `${JSON.stringify(analysis, null, 2)}\n`;
  fs.writeFileSync(outputPath, payload, "utf8");
}
