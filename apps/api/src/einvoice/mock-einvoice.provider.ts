import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type {
  EFaturaDurumu,
  EInvoiceProvider,
  EInvoiceResult,
  InvoicePayload,
} from "./einvoice.provider";

/**
 * Geliştirme/test için sahte e-Fatura sağlayıcısı.
 * Gerçek entegratör seçilene kadar fatura akışını uçtan uca çalıştırır.
 */
@Injectable()
export class MockEInvoiceProvider implements EInvoiceProvider {
  readonly name = "MOCK";
  private readonly logger = new Logger(MockEInvoiceProvider.name);

  async send(invoice: InvoicePayload): Promise<EInvoiceResult> {
    this.logger.log(
      `[MOCK] Fatura gönderiliyor: ${invoice.faturaNo ?? invoice.uuid} ` +
        `(${invoice.belgeTipi}) tutar=${invoice.genelToplam} ${invoice.paraBirimi}`,
    );
    const providerDocumentId = `MOCK-${randomUUID()}`;
    return {
      basarili: true,
      durum: "ACCEPTED",
      providerDocumentId,
      gibStatusCode: "1300",
      gibStatusDescription: "Başarıyla işlendi (mock)",
      ublXml: this.basitUbl(invoice),
      pdfUrl: `/mock-einvoice/${providerDocumentId}.pdf`,
      raw: { mock: true, receivedAt: new Date().toISOString() },
    };
  }

  async cancel(documentId: string, reason: string): Promise<EInvoiceResult> {
    this.logger.log(`[MOCK] Fatura iptal: ${documentId} (${reason})`);
    return {
      basarili: true,
      durum: "NONE",
      providerDocumentId: documentId,
      gibStatusDescription: "İptal edildi (mock)",
    };
  }

  async getStatus(_documentId: string): Promise<EFaturaDurumu> {
    return "ACCEPTED";
  }

  async isEInvoiceUser(vknTckn: string): Promise<boolean> {
    // Mock kural: son hanesi çift olan VKN/TCKN e-Fatura mükellefi sayılır.
    const son = Number(vknTckn.trim().slice(-1));
    return Number.isFinite(son) && son % 2 === 0;
  }

  async getPdf(documentId: string): Promise<string> {
    return `MOCK PDF for ${documentId}`;
  }

  private basitUbl(invoice: InvoicePayload): string {
    return [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<Invoice><!-- MOCK UBL-TR -->`,
      `  <UUID>${invoice.uuid}</UUID>`,
      `  <ID>${invoice.faturaNo ?? ""}</ID>`,
      `  <IssueDate>${invoice.tarih}</IssueDate>`,
      `  <PayableAmount currencyID="${invoice.paraBirimi}">${invoice.genelToplam}</PayableAmount>`,
      `</Invoice>`,
    ].join("\n");
  }
}
