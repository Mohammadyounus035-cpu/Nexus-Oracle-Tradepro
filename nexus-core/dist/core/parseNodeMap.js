import fs from "node:fs";
import path from "node:path";
export function parseNodeMap(csvPath) {
    const raw = fs.readFileSync(path.resolve(csvPath), "utf-8");
    const lines = raw.trim().split("\n");
    const headers = lines[0].split(",").map((header) => header.trim());
    return lines.slice(1).map((line) => {
        const values = line.split(",");
        const record = {};
        headers.forEach((header, index) => {
            record[header] = values[index]?.trim() ?? "";
        });
        return {
            id: Number(record.id),
            node_id: record.node_id,
            x: Number(record.x),
            y: Number(record.y),
            label: record.label,
            number: Number(record.number),
            weight: Number(record.weight),
            guardian: record.guardian,
            triad: record.triad,
            hexagram: record.hexagram,
            type: record.type,
            dormant: record.dormant === "true"
        };
    });
}
