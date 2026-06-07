/**
 * e-Fatura / e-Arşiv sağlayıcı soyutlaması.
 *
 * Amaç: Faturalama domain'i tek bir arayüze konuşur; gerçek özel entegratör
 * (Nilvera, Mikro, Foriba, Uyumsoft...) ileride bu arayüzü implemente ederek
 * domain koduna dokunmadan takılır. Seçim DI token'ı (E_INVOICE_PROVIDER env)
 * ile yapılır.
 */

export const E_INVOICE_PROVIDER = "E_INVOICE_PROVIDER";

export type EFaturaBelgeTipi = "EFATURA" | "EARSIV";
export type EFaturaProfili =
  | "TEMELFATURA"
  | "TICARIFATURA"
  | "EARSIVFATURA";
export type EFaturaDurumu =
  | "NONE"
  | "QUEUED"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "ERROR";

/** Taraf (gönderici/alıcı) bilgisi — faturada snapshot olarak saklanır. */
export interface TarafBilgisi {
  unvan: string;
  vknTckn: string;
  vergiDairesi?: string;
  adres?: string;
  email?: string;
}

export interface FaturaSatiri {
  aciklama: string;
  miktar: number;
  birim: string;
  birimFiyat: number;
  kdvOrani: number;
  kdvTutari: number;
  iskontoOrani?: number;
  satirMatrah: number;
  satirToplam: number;
}

/** Sağlayıcıya gönderilen normalize fatura yükü (ham UBL değil). */
export interface InvoicePayload {
  uuid: string; // ETTN
  faturaNo?: string;
  belgeTipi: EFaturaBelgeTipi;
  profil: EFaturaProfili;
  tarih: string; // ISO
  paraBirimi: string;
  gonderici: TarafBilgisi;
  alici: TarafBilgisi;
  satirlar: FaturaSatiri[];
  araToplam: number;
  kdvToplam: number;
  genelToplam: number;
}

export interface EInvoiceResult {
  basarili: boolean;
  durum: EFaturaDurumu;
  providerDocumentId?: string;
  gibStatusCode?: string;
  gibStatusDescription?: string;
  ublXml?: string;
  pdfUrl?: string;
  raw?: unknown;
}

export interface EInvoiceProvider {
  readonly name: string;

  /** Faturayı entegratöre/GİB'e gönderir. */
  send(invoice: InvoicePayload): Promise<EInvoiceResult>;

  /** Gönderilmiş faturayı iptal eder. */
  cancel(documentId: string, reason: string): Promise<EInvoiceResult>;

  /** Belge durumunu sorgular. */
  getStatus(documentId: string): Promise<EFaturaDurumu>;

  /** Alıcının e-Fatura mükellefi olup olmadığını sorgular (e-Fatura vs e-Arşiv). */
  isEInvoiceUser(vknTckn: string): Promise<boolean>;

  /** Belge PDF'ini döner. */
  getPdf(documentId: string): Promise<Buffer | string>;
}
