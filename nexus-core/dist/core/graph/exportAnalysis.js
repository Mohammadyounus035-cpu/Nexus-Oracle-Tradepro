import fs from "node:fs";
import path from "node:path";
import { sha256Hex, stableStringify } from "./hash.js";
export function exportAnalysis(analysis, outputPath = "./analysis.json") {
    const payload = `${JSON.stringify(analysis, null, 2)}\n`;
    fs.writeFileSync(outputPath, payload, "utf8");
    export function exportAnalysis(analysis, outputPath = "./analysis.json") {
        const serialized = stableStringify(analysis);
        fs.writeFileSync(outputPath, `${serialized}\n`);
        const hash = sha256Hex(`${serialized}\n`);
        const hashPath = `${outputPath}.sha256`;
        const fileName = path.basename(outputPath);
        fs.writeFileSync(hashPath, `${hash}  ${fileName}\n`);
        return { outputPath, hashPath, hash };
    }
}
