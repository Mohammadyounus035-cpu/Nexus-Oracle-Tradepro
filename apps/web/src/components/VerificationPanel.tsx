import { useState } from "react";

export default function VerificationPanel({ proof, verified }: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-xl p-4 bg-black/40 text-white">
      <div className="flex justify-between items-center">
        <span className="font-bold">Verification Status</span>
        <span className={verified ? "text-green-400" : "text-red-400"}>
          {verified ? "VERIFIED" : "INVALID"}
        </span>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs mt-2 opacity-70"
      >
        {expanded ? "Hide Details" : "Show Details"}
      </button>

      {expanded && proof && (
        <div className="mt-3 text-xs font-mono break-all">
          <p><b>Hash:</b> {proof.hash}</p>
          <p><b>Signature:</b> {proof.signature.slice(0, 32)}...</p>
          <p><b>Algorithm:</b> {proof.algorithm}</p>
        </div>
      )}
    </div>
  );
}
