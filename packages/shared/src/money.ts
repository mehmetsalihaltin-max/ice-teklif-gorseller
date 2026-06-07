/**
 * Para ve KDV hesaplama yardımcıları.
 *
 * Önemli: Para değerleri veritabanında Decimal(18,4) olarak saklanır. Burada
 * hesaplamalar `number` üzerinden yapılır; sunum/kayıt sırasında 2 (para) veya
 * 4 (birim fiyat) ondalığa yuvarlanır. Kritik finansal toplamlar API tarafında
 * Decimal ile teyit edilmelidir.
 */
import type { KdvOrani } from "./enums.js";

/** Verilen değeri 2 ondalık (kuruş) hassasiyetine yuvarlar. */
export function paraYuvarla(deger: number): number {
  return Math.round((deger + Number.EPSILON) * 100) / 100;
}

/** KDV hariç tutar üzerinden KDV tutarını hesaplar. */
export function kdvHesapla(matrah: number, oran: KdvOrani): number {
  return paraYuvarla((matrah * oran) / 100);
}

export interface SatirHesapGirdi {
  miktar: number;
  birimFiyat: number;
  kdvOrani: KdvOrani;
  /** % cinsinden iskonto (0-100), opsiyonel */
  iskontoOrani?: number;
}

export interface SatirHesapSonuc {
  brutTutar: number;
  iskontoTutari: number;
  matrah: number;
  kdvTutari: number;
  satirToplam: number;
}

/** Tek bir satır kalemi için tutarları hesaplar. */
export function satirHesapla(girdi: SatirHesapGirdi): SatirHesapSonuc {
  const brutTutar = paraYuvarla(girdi.miktar * girdi.birimFiyat);
  const iskontoTutari = paraYuvarla((brutTutar * (girdi.iskontoOrani ?? 0)) / 100);
  const matrah = paraYuvarla(brutTutar - iskontoTutari);
  const kdvTutari = kdvHesapla(matrah, girdi.kdvOrani);
  const satirToplam = paraYuvarla(matrah + kdvTutari);
  return { brutTutar, iskontoTutari, matrah, kdvTutari, satirToplam };
}

export interface KdvKirilimSatiri {
  oran: KdvOrani;
  matrah: number;
  kdv: number;
}

export interface BelgeToplami {
  araToplam: number;
  iskontoToplam: number;
  kdvToplam: number;
  genelToplam: number;
  kdvKirilim: KdvKirilimSatiri[];
}

/** Bir belgenin (sipariş/fatura) tüm satırlarından KDV kırılımlı toplamı üretir. */
export function belgeToplamiHesapla(satirlar: SatirHesapGirdi[]): BelgeToplami {
  const kirilimMap = new Map<KdvOrani, KdvKirilimSatiri>();
  let araToplam = 0;
  let iskontoToplam = 0;
  let kdvToplam = 0;

  for (const satir of satirlar) {
    const s = satirHesapla(satir);
    araToplam = paraYuvarla(araToplam + s.matrah);
    iskontoToplam = paraYuvarla(iskontoToplam + s.iskontoTutari);
    kdvToplam = paraYuvarla(kdvToplam + s.kdvTutari);

    const mevcut = kirilimMap.get(satir.kdvOrani) ?? {
      oran: satir.kdvOrani,
      matrah: 0,
      kdv: 0,
    };
    mevcut.matrah = paraYuvarla(mevcut.matrah + s.matrah);
    mevcut.kdv = paraYuvarla(mevcut.kdv + s.kdvTutari);
    kirilimMap.set(satir.kdvOrani, mevcut);
  }

  return {
    araToplam,
    iskontoToplam,
    kdvToplam,
    genelToplam: paraYuvarla(araToplam + kdvToplam),
    kdvKirilim: [...kirilimMap.values()].sort((a, b) => a.oran - b.oran),
  };
}

/** Kâr/marj hesabı: satış anındaki maliyet (snapshot) ile satış fiyatından. */
export function karHesapla(
  birimFiyat: number,
  birimMaliyet: number,
  miktar: number,
): { brutKar: number; marjYuzde: number } {
  const brutKar = paraYuvarla((birimFiyat - birimMaliyet) * miktar);
  const gelir = birimFiyat * miktar;
  const marjYuzde = gelir > 0 ? paraYuvarla((brutKar / gelir) * 100) : 0;
  return { brutKar, marjYuzde };
}
