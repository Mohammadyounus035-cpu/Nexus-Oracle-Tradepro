import React, { useCallback, useEffect, useState } from "react"
import { formatUSD } from "./money"
import { loadOrCreateKeyPair } from "./keystore"
import { calculateBound, verifyProof, type BoundProof, type KeyPair } from "./signing"
import { exportProof } from "./proof"

export default function VerificationPanel() {
  const [principal, setPrincipal] = useState(167.89)
  const [rate, setRate] = useState(0.05)
  const [years, setYears] = useState(10)
  const [proof, setProof] = useState<BoundProof | null>(null)
  const [verification, setVerification] = useState<{
    hashValid: boolean
    signatureValid: boolean
    trustworthy: boolean
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null)

  useEffect(() => {
    loadOrCreateKeyPair().then(setKeyPair)
  }, [])

  const handleCalculateAndBind = useCallback(async () => {
    if (!keyPair) return

    setLoading(true)
    try {
      const nextProof = await calculateBound({ principal, rate, years }, keyPair)
      setProof(nextProof)
      setVerification(await verifyProof(nextProof))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [principal, rate, years, keyPair])

  const handleTamperTest = useCallback(async () => {
    if (!proof) return

    const tampered: BoundProof = {
      ...proof,
      data: {
        ...proof.data,
        final: proof.data.final + 1
      }
    }

    setProof(tampered)
    setVerification(await verifyProof(tampered))
  }, [proof])

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "40px auto",
        padding: 24,
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#0f172a",
        color: "#e2e8f0",
        borderRadius: 12,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
      }}
    >
      <h2 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 600, color: "#f8fafc" }}>
        SABR-HOLD Bound Proof
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
          Principal ($)
          <input
            type="number"
            step="0.01"
            value={principal}
            onChange={e => setPrincipal(parseFloat(e.target.value))}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #334155", background: "#1e293b", color: "#f1f5f9", fontSize: 14 }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
          Rate (decimal)
          <input
            type="number"
            step="0.01"
            value={rate}
            onChange={e => setRate(parseFloat(e.target.value))}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #334155", background: "#1e293b", color: "#f1f5f9", fontSize: 14 }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
          Years
          <input
            type="number"
            value={years}
            onChange={e => setYears(parseInt(e.target.value, 10))}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #334155", background: "#1e293b", color: "#f1f5f9", fontSize: 14 }}
          />
        </label>
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
        <button
          onClick={handleCalculateAndBind}
          disabled={loading || !keyPair}
          style={{
            padding: "12px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          {loading ? "Calculating..." : "Calculate & Bind"}
        </button>
        <button
          onClick={() => proof && exportProof(proof)}
          disabled={!proof}
          style={{
            padding: "12px",
            background: "#0ea5e9",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Export Proof
        </button>
      </div>

      {proof && (
        <div style={{ background: "#1e293b", padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #334155" }}>
            <span>Principal:</span>
            <strong>{formatUSD(proof.data.principal)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #334155" }}>
            <span>Final Amount:</span>
            <strong style={{ color: "#34d399", fontSize: 16 }}>{formatUSD(proof.data.final)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #334155" }}>
            <span>Gain:</span>
            <strong>{formatUSD(proof.data.gain)}</strong>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: "#93c5fd" }}>
            {proof.system.state} • output={proof.system.context.output} • drift={proof.system.context.drift}
          </div>

          {verification && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 6,
                color: "white",
                fontWeight: 600,
                fontSize: 13,
                marginTop: 12,
                background: verification.trustworthy ? "#10b981" : "#ef4444"
              }}
            >
              {verification.trustworthy ? "Authentic — Hash & Signature Verified" : "Tampered — Verification Failed"}
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>SHA-256 Hash</label>
            <code style={{ display: "block", fontSize: 11, fontFamily: "monospace", color: "#94a3b8", wordBreak: "break-all", background: "#0f172a", padding: 8, borderRadius: 4 }}>
              {proof.verification.hash}
            </code>
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Signature</label>
            <code style={{ display: "block", fontSize: 11, fontFamily: "monospace", color: "#94a3b8", wordBreak: "break-all", background: "#0f172a", padding: 8, borderRadius: 4 }}>
              {proof.verification.signature}
            </code>
          </div>

          <button
            onClick={handleTamperTest}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: 12,
              background: "#7f1d1d",
              color: "#fca5a5",
              border: "1px solid #991b1b",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12
            }}
          >
            Simulate Tampering
          </button>
        </div>
      )}
    </div>
  )
}
