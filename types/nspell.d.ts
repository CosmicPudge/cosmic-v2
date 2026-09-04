declare module "nspell" {
  interface NSpell {
    correct(word: string): boolean;
    suggest(word: string): string[];
    add(word: string): void;
  }
  function nspell(dictionary: { aff: Uint8Array; dic: Uint8Array }): NSpell;
  export default nspell;
}
