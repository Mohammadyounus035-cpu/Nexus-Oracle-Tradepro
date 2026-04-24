import type { BoundProof } from "./signing"

export function exportProof(proof: BoundProof): void {
  const blob = new Blob([JSON.stringify(proof, null, 2)], {
    type: "application/json"
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "sabr-hold-proof.json"
  a.click()
  URL.revokeObjectURL(url)
}
