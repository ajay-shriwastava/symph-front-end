export function truncate(str: string | null, n: number): string {
  if (!str) return "";
  return str.length > n ? str.slice(0, n) + "…" : str;
}
