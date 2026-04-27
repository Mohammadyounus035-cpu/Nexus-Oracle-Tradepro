import type { Instruction } from "./types.js";

export const SAFE_BOOT_SEQUENCE: Instruction[] = [
  "GROUND",
  "DETECT",
  "CONVERGE",
  "STABILIZE"
];

export const RECOVERY_SEQUENCE: Instruction[] = ["DETECT", "CORRECT", "STABILIZE"];

export function parseInstruction(value: string): Instruction | null {
  const normalized = value.trim().toUpperCase();

  switch (normalized) {
    case "APPROX":
    case "ADVANCE":
    case "DETECT":
    case "CORRECT":
    case "ENTANGLE":
    case "STABILIZE":
    case "GROUND":
    case "CONVERGE":
      return normalized;
    default:
      return null;
  }
}
