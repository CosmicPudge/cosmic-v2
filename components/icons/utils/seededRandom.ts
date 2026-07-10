export function createSeededRandom(seed: string) {
  // FNV-1a hash
  let hash = 2166136261;

  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return function random(min = 0, max = 1) {
    hash += 0x6d2b79f5;

    let t = hash;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    const value =
      ((t ^ (t >>> 14)) >>> 0) / 4294967296;

    return min + value * (max - min);
  };
}