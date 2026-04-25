// 🔐 PRODUCTION-GRADE SIGNING SERVER (EXPANDED)
import express from "express";
import nacl from "tweetnacl";
import crypto from "crypto";

const app = express();
app.use(express.json());

// In production: replace with KMS/HSM
const keyPair = nacl.sign.keyPair();

// CORS (required for Codespaces + browser)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Deterministic canonicalizer
function canonicalize(obj: any): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

app.post("/sign", (req, res) => {
  try {
    const payload = req.body;

    const canonical = canonicalize(payload);
    const hash = crypto.createHash("sha256").update(canonical).digest();

    const signature = nacl.sign.detached(hash, keyPair.secretKey);

    res.json({
      proof: {
        canonicalPayload: Buffer.from(canonical).toString("base64"),
        hash: hash.toString("hex"),
        signature: Buffer.from(signature).toString("base64"),
        publicKey: Buffer.from(keyPair.publicKey).toString("base64"),
        algorithm: "Ed25519",
        serverTime: new Date().toISOString()
      },
      status: "OK"
    });
  } catch (err) {
    res.status(500).json({ status: "ERROR", message: String(err) });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "alive" });
});

app.listen(3001, () => {
  console.log("🔐 Ω Signing Server running on port 3001");
});
