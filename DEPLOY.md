# TİGNAL — Google Cloud Run'a Deploy

Bu rehber TİGNAL'i Google Cloud Run'a yayınlar. Mimari:

- **API** (NestJS) → Cloud Run servisi (container)
- **Web** (Next.js) → Cloud Run servisi (container)
- **Veritabanı** (PostgreSQL) → Neon (ücretsiz, en hızlı) **veya** Cloud SQL

> Tüm container yapılandırması hazırdır: `apps/api/Dockerfile`, `apps/web/Dockerfile`,
> Cloud Build dosyaları ve tek komutluk `deploy/cloudrun.sh` betiği.

---

## 0) Gereksinimler

- Google Cloud hesabı + **faturalandırma açık** bir proje
- [`gcloud` CLI](https://cloud.google.com/sdk/docs/install) kurulu
- Giriş:
  ```bash
  gcloud auth login
  gcloud config set project PROJECT_ID
  ```

## 1) Veritabanı (PostgreSQL)

**Seçenek A — Neon (önerilen, ücretsiz, 2 dk):**
1. https://neon.tech → proje oluştur
2. Connection string'i kopyala (örn. `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/tignal?sslmode=require`)

**Seçenek B — Cloud SQL (GCP yerel):**
```bash
gcloud sql instances create tignal-db --database-version=POSTGRES_16 \
  --tier=db-f1-micro --region=europe-west1
gcloud sql databases create tignal --instance=tignal-db
gcloud sql users set-password postgres --instance=tignal-db --password=GUCLU_SIFRE
```
Cloud SQL için Cloud Run'a bağlantı (Unix socket) ek ayar gerektirir; en hızlı
başlangıç için Neon önerilir.

## 2) Tek komutla deploy

Değişkenleri verip betiği çalıştırın:

```bash
export DATABASE_URL="postgresql://...neon.../tignal?sslmode=require"
export JWT_ACCESS_SECRET="$(openssl rand -hex 32)"
export JWT_REFRESH_SECRET="$(openssl rand -hex 32)"
export REGION="europe-west1"   # opsiyonel

bash deploy/cloudrun.sh
```

Betik sırasıyla:
1. Gerekli GCP API'lerini açar, Artifact Registry deposu oluşturur
2. API imajını derler (Cloud Build)
3. **Migration + seed** çalıştırır (firma + admin kullanıcı + örnek ürünler)
4. API'yi Cloud Run'a deploy eder, URL'yi alır
5. Web imajını API adresiyle derleyip deploy eder
6. API CORS'unu web adresine günceller

Bitince **Web URL** ve **API URL** ekrana yazılır.

**Giriş:** `admin@tignal.local` / `Admin1234!`
> Üretimde ilk girişten sonra admin şifresini değiştirin.

---

## 3) Manuel adımlar (betik yerine)

```bash
PROJECT_ID=$(gcloud config get-value project)
REGION=europe-west1
REPO=tignal
AR=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create $REPO --repository-format=docker --location=$REGION

# API imajı + migration/seed + deploy
gcloud builds submit --config apps/api/cloudbuild.yaml --substitutions _IMAGE=$AR/api:latest .
gcloud run jobs deploy tignal-migrate --image $AR/api:latest --region $REGION \
  --set-env-vars DATABASE_URL="$DATABASE_URL" --command sh \
  --args "-c,pnpm --filter @tignal/db migrate:deploy && pnpm --filter @tignal/db seed"
gcloud run jobs execute tignal-migrate --region $REGION --wait
gcloud run deploy tignal-api --image $AR/api:latest --region $REGION --allow-unauthenticated --port 8080 \
  --set-env-vars DATABASE_URL="$DATABASE_URL",JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET",JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET",E_INVOICE_PROVIDER=MOCK,NODE_ENV=production
API_URL=$(gcloud run services describe tignal-api --region $REGION --format 'value(status.url)')

# Web imajı (API adresi derlemede gömülür) + deploy
gcloud builds submit --config apps/web/cloudbuild.yaml --substitutions _IMAGE=$AR/web:latest,_API_URL=$API_URL .
gcloud run deploy tignal-web --image $AR/web:latest --region $REGION --allow-unauthenticated --port 8080
WEB_URL=$(gcloud run services describe tignal-web --region $REGION --format 'value(status.url)')

# API CORS'unu web adresine güncelle
gcloud run services update tignal-api --region $REGION --update-env-vars WEB_ORIGIN=$WEB_URL
```

---

## 4) Ortam değişkenleri (özet)

| Servis | Değişken | Açıklama |
|--------|----------|----------|
| API | `DATABASE_URL` | PostgreSQL bağlantı dizesi |
| API | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | JWT imzalama anahtarları |
| API | `WEB_ORIGIN` | Web'in URL'si (CORS) |
| API | `E_INVOICE_PROVIDER` | `MOCK` (gerçek entegratör eklenince değişir) |
| Web | `NEXT_PUBLIC_API_URL` | **Derleme anında** verilir (build-arg / cloudbuild substitution) |

## 5) Notlar / Sık karşılaşılanlar

- **NEXT_PUBLIC_API_URL derleme anında gömülür.** API adresi değişirse web imajını
  yeniden derleyip deploy edin.
- **CORS hatası:** API'de `WEB_ORIGIN`'in web URL'siyle birebir aynı olduğundan emin olun.
- **Çerez/oturum:** Cloud Run'da iki farklı `*.run.app` alt alan adı kullanılır;
  oturum token'ı tarayıcı çerezinde tutulur ve `Authorization` başlığıyla taşınır,
  cross-site sorun çıkmaz. (İstenirse ileride tek özel alan adı altında birleştirilebilir.)
- **Maliyet:** Cloud Run "scale-to-zero" çalışır; trafik yoksa ücret yok denecek kadar azdır.
