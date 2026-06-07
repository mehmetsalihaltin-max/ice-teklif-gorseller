import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { E_INVOICE_PROVIDER } from "./einvoice.provider";
import { MockEInvoiceProvider } from "./mock-einvoice.provider";

/**
 * Aktif e-Fatura sağlayıcısını env (E_INVOICE_PROVIDER) değerine göre seçer.
 * Şimdilik yalnızca MOCK mevcut; gerçek entegratörler buraya eklenir.
 */
@Global()
@Module({
  providers: [
    MockEInvoiceProvider,
    {
      provide: E_INVOICE_PROVIDER,
      inject: [ConfigService, MockEInvoiceProvider],
      useFactory: (config: ConfigService, mock: MockEInvoiceProvider) => {
        const secilen = config.get<string>("E_INVOICE_PROVIDER") ?? "MOCK";
        switch (secilen) {
          // case "NILVERA": return new NilveraProvider(...);
          case "MOCK":
          default:
            return mock;
        }
      },
    },
  ],
  exports: [E_INVOICE_PROVIDER],
})
export class EInvoiceModule {}
