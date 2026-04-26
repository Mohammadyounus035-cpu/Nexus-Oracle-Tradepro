#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT_DIR}"

if ! command -v npm >/dev/null 2>&1; then
  echo "[error] npm is required." >&2
  exit 1
fi

if [[ ! -f package.json ]]; then
  echo "[error] package.json not found in ${ROOT_DIR}." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
fi

npm run analyze

if command -v sha256sum >/dev/null 2>&1; then
  sha256sum analysis.json | awk '{print $1"  analysis.json"}' > analysis.sha256
  sha256sum -c analysis.sha256
elif command -v shasum >/dev/null 2>&1; then
  shasum -a 256 analysis.json | awk '{print $1"  analysis.json"}' > analysis.sha256
  shasum -a 256 -c analysis.sha256
else
  echo "[error] Neither sha256sum nor shasum was found." >&2
  exit 1
fi

echo "[ok] analysis.json and analysis.sha256 generated and verified."
npm run analyze
python3 verify.py --analysis analysis.json --sha analysis.json.sha256

python3 - <<'PY'
import json
from pathlib import Path

manifest_path = Path("manifest.json")
sha_path = Path("analysis.json.sha256")
hash_value = sha_path.read_text(encoding="utf-8").strip().split()[0]

manifest = {}
if manifest_path.exists():
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

manifest["analysis"] = {
    "path": "analysis.json",
    "sha256": hash_value,
}

manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"Updated {manifest_path} with analysis hash {hash_value}")
PY
