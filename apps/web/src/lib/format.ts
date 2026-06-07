const tl = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

export function formatTL(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  return tl.format(Number.isFinite(n) ? (n as number) : 0);
}
