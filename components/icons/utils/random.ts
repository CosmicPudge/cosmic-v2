export const random = (min: number, max: number) =>
  Math.random() * (max - min) + min;

export const randomInt = (min: number, max: number) =>
  Math.floor(random(min, max + 1));

export const randomChoice = <T,>(items: readonly T[]) =>
  items[Math.floor(Math.random() * items.length)];