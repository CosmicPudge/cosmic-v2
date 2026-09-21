/** True only when School scope is authorized to request account-backed data. */
export function shouldLoadAccountBackedSchoolData(scopeKind: string): boolean {
  return scopeKind === "account";
}
