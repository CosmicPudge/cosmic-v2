const HASH_OFFSET_BASIS = 2166136261;
const HASH_PRIME = 16777619;
const UINT32_RANGE = 4294967296;
const MULBERRY_INCREMENT = 1831565813;
const MULBERRY_MULTIPLIER_A = 15;
const MULBERRY_MULTIPLIER_B = 7;
const MULBERRY_MULTIPLIER_C = 61;
const MULBERRY_MULTIPLIER_D = 14;

/**
 * Deterministic pseudo-random number generator for procedural content.
 */
export class SeededRandom {
  private state: number;

  public constructor(seed: string | number) {
    this.state =
      typeof seed === "string" ? SeededRandom.hashString(seed) : seed >>> 0;
  }

  /**
   * Returns a deterministic value in the range [0, 1).
   */
  public next(): number {
    this.state = (this.state + MULBERRY_INCREMENT) >>> 0;

    let value = this.state;
    value = Math.imul(value ^ (value >>> MULBERRY_MULTIPLIER_A), value | 1);
    value ^=
      value +
      Math.imul(
        value ^ (value >>> MULBERRY_MULTIPLIER_B),
        value | MULBERRY_MULTIPLIER_C,
      );

    return ((value ^ (value >>> MULBERRY_MULTIPLIER_D)) >>> 0) / UINT32_RANGE;
  }

  public range(minimum: number, maximum: number): number {
    return minimum + (maximum - minimum) * this.next();
  }

  public integer(minimum: number, maximumExclusive: number): number {
    return Math.floor(this.range(minimum, maximumExclusive));
  }

  public boolean(chance: number = 0.5): boolean {
    return this.next() < chance;
  }

  public pick<Value>(values: readonly Value[]): Value {
    if (values.length === 0) {
      throw new Error("SeededRandom.pick requires at least one value.");
    }

    return values[this.integer(0, values.length)] as Value;
  }

  public fork(namespace: string): SeededRandom {
    return new SeededRandom(`${this.state}:${namespace}`);
  }

  private static hashString(value: string): number {
    let hash = HASH_OFFSET_BASIS;

    for (let characterIndex = 0; characterIndex < value.length; characterIndex += 1) {
      hash ^= value.charCodeAt(characterIndex);
      hash = Math.imul(hash, HASH_PRIME);
    }

    return hash >>> 0;
  }
}