export interface CustomSymbol {
  symbol: string;
  name: string;
  sector: string;
  initialDollars: number;
  vol: number;
}

const STORAGE_KEY = "nexus.customSymbols.v1";

export function loadCustomSymbols(): CustomSymbol[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomSymbols(list: CustomSymbol[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
