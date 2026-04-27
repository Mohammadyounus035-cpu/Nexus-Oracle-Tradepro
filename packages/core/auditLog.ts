// 📜 APPEND-ONLY AUDIT LOG

const STORE_KEY = "omega_audit_log";

export function appendLog(entry: any) {
  const existing = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
  existing.push(entry);
  localStorage.setItem(STORE_KEY, JSON.stringify(existing));
}

export function getLog() {
  return JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
}

export function exportLog() {
  const data = getLog();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "omega_audit_log.json";
  a.click();
}
