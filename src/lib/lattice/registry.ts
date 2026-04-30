import { Guardian, LatticePath, LatticePolarity, PathId } from './types';

export const PATH_COUNT = 96;
export const DEGREES_PER_PATH = 3.75;

const DORMANT_PATHS = new Set([10, 28, 37, 46, 55, 63, 72, 80, 86, 91]);
const ANGELU_PATHS = new Set([1, 4, 7, 11, 13, 15, 17, 20, 22, 24, 26, 29, 31, 34, 36, 39, 41, 43, 45, 48, 50, 52, 58, 60, 62, 65, 67, 69, 73, 77]);
const DEMINU_PATHS = new Set([2, 5, 8, 12, 14, 16, 18, 21, 23, 25, 27, 30, 32, 35, 38, 40, 42, 44, 47, 49, 51, 57, 59, 61, 66, 70, 76, 96]);

export const LATTICE_REGISTRY: LatticePath[] = Array.from({ length: PATH_COUNT }, (_, offset) => {
  const index = offset + 1;
  const dormant = DORMANT_PATHS.has(index);
  const polarity = resolvePolarity(index, dormant);
  return {
    id: formatPathId(index),
    index,
    angleDeg: (index - 1) * DEGREES_PER_PATH,
    guardian: guardianForPath(index),
    polarity,
    confidence: dormant ? 0 : confidenceForPath(index),
    active: !dormant,
    domain: domainForPath(index),
    category: categoryForPath(index, dormant),
  };
});

export function getPathByIndex(index: number): LatticePath {
  const normalized = ((Math.round(index) - 1) % PATH_COUNT + PATH_COUNT) % PATH_COUNT;
  const path = LATTICE_REGISTRY[normalized];
  if (!path) throw new Error(`Missing lattice path for index ${index}`);
  return path;
}

export function getNearestActivePath(index: number): LatticePath {
  const start = Math.round(index);
  for (let distance = 0; distance < PATH_COUNT; distance++) {
    const forward = getPathByIndex(start + distance);
    if (forward.active) return forward;
    const backward = getPathByIndex(start - distance);
    if (backward.active) return backward;
  }
  return getPathByIndex(1);
}

export function guardianForPath(index: number): Guardian {
  if (index >= 1 && index <= 19) return 'Lion';
  if (index >= 20 && index <= 38) return 'Phoenix';
  if (index >= 39 && index <= 57) return 'Dragon';
  if (index >= 58 && index <= 76) return 'Owl';
  return 'Raven';
}

function formatPathId(index: number): PathId {
  return `P-${String(index).padStart(2, '0')}`;
}

function resolvePolarity(index: number, dormant: boolean): LatticePolarity {
  if (dormant) return 'DORMANT';
  if (ANGELU_PATHS.has(index)) return 'ANGELU';
  if (DEMINU_PATHS.has(index)) return 'DEMINU';
  return 'NEUTRAL';
}

function confidenceForPath(index: number): number {
  if (index >= 38 && index <= 40) return 98;
  if (index <= 10) return 92;
  if (index <= 24) return 88;
  if (index <= 36) return 84;
  if (index <= 52) return 82;
  return 78;
}

function domainForPath(index: number): string {
  const domains = ['AI', 'Cybersecurity', 'Constitutional', 'Blockchain', 'Data Analytics', 'Software Dev', 'Sustainability', 'UX', 'IoT', 'Cloud Computing'];
  return domains[(index - 1) % domains.length] ?? 'Data Analytics';
}

function categoryForPath(index: number, dormant: boolean): string {
  if (dormant) return 'Standby/Dark';
  if (index <= 10) return 'Sovereign Core';
  if (index <= 24) return 'Intelligence';
  if (index <= 36) return 'Operational';
  if (index <= 44) return 'Constitutional';
  return 'Infrastructure';
}

