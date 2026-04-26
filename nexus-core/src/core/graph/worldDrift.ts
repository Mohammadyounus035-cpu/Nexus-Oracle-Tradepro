import { sha256Hex } from "./hash.js";

export type WorldDrift = {
  percent: number;
  status: "SYNC" | "DRIFT";
  uiHash: string;
  artifactHash: string;
};

export function calculateWorldDrift(uiPayload: string, artifactPayload: string): WorldDrift {
  const uiHash = sha256Hex(uiPayload);
  const artifactHash = sha256Hex(artifactPayload);

  if (uiHash === artifactHash) {
    return {
      percent: 0,
      status: "SYNC",
      uiHash,
      artifactHash
    };
  }

  const maxLength = Math.max(uiPayload.length, artifactPayload.length, 1);
  const minLength = Math.min(uiPayload.length, artifactPayload.length);
  let mismatches = maxLength - minLength;

  for (let i = 0; i < minLength; i += 1) {
    if (uiPayload.charCodeAt(i) !== artifactPayload.charCodeAt(i)) {
      mismatches += 1;
    }
  }

  const percent = Number(((mismatches / maxLength) * 100).toFixed(2));

  return {
    percent,
    status: "DRIFT",
    uiHash,
    artifactHash
  };
}
