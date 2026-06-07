# TİGNAL

Cep telefonu aksesuarları satan, **bayi ağı** olan bir firma için Paraşüt benzeri
işletme yönetim uygulaması. Tek sistemden: **stok takibi, satış/alış, cari hesap,
faturalama (GİB e-Fatura/e-Arşiv), CRM, bayi yönetimi ve kâr hesapları**.

> Bu sürüm **Phase 0 (temel dikey dilim)** içerir: monorepo altyapısı, tüm veri
> modeli (Prisma şeması), kimlik doğrulama (JWT + roller) ve uçtan uca **Ürün
> yönetimi (CRUD)**. Sonraki modüller yol haritasındadır.

## Teknoloji

- **Monorepo:** pnpm workspaces + Turborepo
- **Backend:** NestJS (REST + Swagger), Passport JWT
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind, TanStack Query
- **Veritabanı:** PostgreSQL + Prisma ORM
- **Ortak:** `@tignal/shared` (zod şemaları, KDV/para yardımcıları, enum'lar)

## Proje Yapısı

```
apps/
  api/      NestJS API (auth, products, e-fatura soyutlaması)
  web/      Next.js arayüz (login, panel, ürünler)
packages/
  shared/   Ortak tipler, zod şemaları, KDV & para hesapları
  db/       Prisma şeması (tüm varlıklar), migration & seed
```

## Kurulum

Gereksinim: Node 20+, pnpm 10+, PostgreSQL 16 (yerel veya Docker).

```bash
# 1) Ortam değişkenleri
cp .env.example .env            # gerekirse DATABASE_URL'i düzenleyin

# 2) Bağımlılıklar
pnpm install

# 3) Veritabanı (Docker ile)
docker compose up -d            # ya da yerel PostgreSQL kullanın

# 4) Şema + örnek veri
pnpm db:migrate                 # migration uygula
pnpm db:seed                    # firma + admin + örnek ürünler

# 5) Geliştirme (api: 3001, web: 3000)
pnpm dev
```

Varsayılan giriş (seed): `admin@tignal.local` / `Admin1234!`

- Web: http://localhost:3000
- API: http://localhost:3001/api
- Swagger: http://localhost:3001/api/docs

## Yayına Alma (Deploy)

Uygulama **Google Cloud Run** için container olarak hazırdır (API + Web ayrı
servisler, PostgreSQL Neon/Cloud SQL). Tek komutla:

```bash
export DATABASE_URL="postgresql://...";
export JWT_ACCESS_SECRET="$(openssl rand -hex 32)"
export JWT_REFRESH_SECRET="$(openssl rand -hex 32)"
bash deploy/cloudrun.sh
```

Ayrıntılar ve manuel adımlar için **[DEPLOY.md](./DEPLOY.md)**.

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `pnpm dev` | shared/db derler, api + web'i izleme modunda başlatır |
| `pnpm build` | tüm paketleri derler |
| `pnpm db:migrate` | Prisma migration (geliştirme) |
| `pnpm db:seed` | örnek veriyi yükler |
| `pnpm db:studio` | Prisma Studio |

## e-Fatura (GİB)

Şimdilik **mock** sağlayıcı (`MockEInvoiceProvider`) kullanılır. Gerçek özel
entegratör (Nilvera/Mikro/Foriba/Uyumsoft) `EInvoiceProvider` arayüzünü
(`apps/api/src/einvoice/`) implemente ederek `E_INVOICE_PROVIDER` env değeri ile
domain koduna dokunmadan takılır.

## Yol Haritası

- **Phase 1:** Katalog/stok, müşteri/tedarikçi/cari, alış-satış (POS), kasa/ödeme, faturalama, panel
- **Phase 2:** Fiyat listeleri, bayi portalı, CRM (lead/pipeline/aktivite)
- **Phase 3:** Kâr raporları, cari yaşlandırma, gerçek e-Fatura entegratörü, bildirimler
