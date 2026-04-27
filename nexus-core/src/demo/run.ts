import fs from "node:fs";
import { parseNodeMap } from "../core/parseNodeMap.js";
import { exportAnalysis } from "../core/graph/exportAnalysis.js";
import { stableStringify } from "../core/graph/hash.js";
import { runFullAnalysis } from "../core/graph/pipeline.js";
import { calculateWorldDrift } from "../core/graph/worldDrift.js";

const nodes = parseNodeMap("./data/node_map.csv");
const analysis = runFullAnalysis(nodes);
const exported = exportAnalysis(analysis);

const canonicalPayload = `${stableStringify(analysis)}\n`;
const writtenPayload = fs.readFileSync(exported.outputPath, "utf8");
const drift = calculateWorldDrift(canonicalPayload, writtenPayload);

console.log(`Full analysis exported for ${analysis.nodes.length} nodes to ${exported.outputPath}`);
console.log(`SHA-256: ${exported.hash}`);
console.log(`WORLD_DRIFT: ${drift.percent.toFixed(1)}%_${drift.status}`);
