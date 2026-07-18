const HASH_MULTIPLIER_X = 374761393;
const HASH_MULTIPLIER_Y = 668265263;
const HASH_SCRAMBLE_MULTIPLIER = 1274126177;
const HASH_SHIFT = 13;
const UINT32_RANGE = 4294967296;

/**
 * Smooth deterministic value noise for procedural density fields.
 */
export function noise2D(x: number, y: number, seed: number): number {
  const gridX = Math.floor(x);
  const gridY = Math.floor(y);
  const localX = x - gridX;
  const localY = y - gridY;

  const bottomLeft = randomGridValue(gridX, gridY, seed);
  const bottomRight = randomGridValue(gridX + 1, gridY, seed);
  const topLeft = randomGridValue(gridX, gridY + 1, seed);
  const topRight = randomGridValue(gridX + 1, gridY + 1, seed);

  const smoothX = smoothStep(localX);
  const smoothY = smoothStep(localY);
  const bottom = interpolate(bottomLeft, bottomRight, smoothX);
  const top = interpolate(topLeft, topRight, smoothX);

  return interpolate(bottom, top, smoothY);
}

/**
 * Combines several noise frequencies into a natural-looking density field.
 */
export function fractalNoise2D(
  x: number,
  y: number,
  seed: number,
  octaves: number,
  persistence: number,
  lacunarity: number,
): number {
  let total = 0;
  let amplitude = 1;
  let frequency = 1;
  let amplitudeTotal = 0;

  for (let octaveIndex = 0; octaveIndex < octaves; octaveIndex += 1) {
    total += noise2D(x * frequency, y * frequency, seed + octaveIndex) * amplitude;
    amplitudeTotal += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return amplitudeTotal === 0 ? 0 : total / amplitudeTotal;
}

function randomGridValue(gridX: number, gridY: number, seed: number): number {
  let hash =
    Math.imul(gridX, HASH_MULTIPLIER_X) ^
    Math.imul(gridY, HASH_MULTIPLIER_Y) ^
    seed;

  hash = Math.imul(hash ^ (hash >>> HASH_SHIFT), HASH_SCRAMBLE_MULTIPLIER);
  hash ^= hash >>> HASH_SHIFT;

  return (hash >>> 0) / UINT32_RANGE;
}

function smoothStep(value: number): number {
  return value * value * (3 - 2 * value);
}

function interpolate(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}