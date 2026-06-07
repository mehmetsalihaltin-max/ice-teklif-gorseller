/**
 * Sistem genelinde paylaşılan sabitler ve enum'lar.
 * Bu değerler Prisma şemasındaki enum'larla birebir uyumlu tutulmalıdır.
 */

/** Kullanıcı rolleri (RBAC) */
export const Role = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  DEALER: "DEALER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/** Türkiye güncel KDV oranları (%) */
export const KDV_ORANLARI = [0, 1, 10, 20] as const;
export type KdvOrani = (typeof KDV_ORANLARI)[number];
export const VARSAYILAN_KDV: KdvOrani = 20;

/** Para birimleri (MVP: yalnızca TRY aktif kullanılır) */
export const Currency = {
  TRY: "TRY",
  USD: "USD",
  EUR: "EUR",
} as const;
export type Currency = (typeof Currency)[keyof typeof Currency];
export const VARSAYILAN_PARA_BIRIMI: Currency = "TRY";

/** Cari hesap sahibi tipi */
export const CariSahipTipi = {
  CUSTOMER: "CUSTOMER",
  DEALER: "DEALER",
  SUPPLIER: "SUPPLIER",
} as const;
export type CariSahipTipi = (typeof CariSahipTipi)[keyof typeof CariSahipTipi];

/** e-Fatura / e-Arşiv belge tipi */
export const EFaturaBelgeTipi = {
  EFATURA: "EFATURA",
  EARSIV: "EARSIV",
} as const;
export type EFaturaBelgeTipi =
  (typeof EFaturaBelgeTipi)[keyof typeof EFaturaBelgeTipi];

/** e-Fatura gönderim durumu */
export const EFaturaDurumu = {
  NONE: "NONE",
  QUEUED: "QUEUED",
  SENT: "SENT",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  ERROR: "ERROR",
} as const;
export type EFaturaDurumu = (typeof EFaturaDurumu)[keyof typeof EFaturaDurumu];
