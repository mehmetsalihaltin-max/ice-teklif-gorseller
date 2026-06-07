#!/usr/bin/env bash
# TİGNAL — Google Cloud Run otomatik deploy betiği.
#
# Önce aşağıdaki değişkenleri doldurun veya ortam değişkeni olarak verin.
# Gerekli: gcloud CLI kurulu ve `gcloud auth login` + `gcloud config set project` yapılmış olmalı.
#
# Çalıştırma:  bash deploy/cloudrun.sh
set -euo pipefail

# ----------------------- AYARLAR -----------------------
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-europe-west1}"
REPO="${REPO:-tignal}"                       # Artifact Registry deposu
# PostgreSQL bağlantı dizesi (Neon/Cloud SQL). ZORUNLU.
DATABASE_URL="${DATABASE_URL:?DATABASE_URL gerekli (Neon/Cloud SQL bağlantı dizesi)}"
# JWT gizli anahtarları (güçlü rastgele değerler verin)
JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:?JWT_ACCESS_SECRET gerekli}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:?JWT_REFRESH_SECRET gerekli}"
# -------------------------------------------------------

AR_HOST="${REGION}-docker.pkg.dev"
API_IMAGE="${AR_HOST}/${PROJECT_ID}/${REPO}/api:latest"
WEB_IMAGE="${AR_HOST}/${PROJECT_ID}/${REPO}/web:latest"

echo "▶ Proje: $PROJECT_ID  Bölge: $REGION"

echo "▶ Gerekli servisler etkinleştiriliyor…"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com --project "$PROJECT_ID"

echo "▶ Artifact Registry deposu hazırlanıyor…"
gcloud artifacts repositories describe "$REPO" --location "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "$REPO" --repository-format=docker \
    --location "$REGION" --project "$PROJECT_ID"

echo "▶ [1/4] API imajı derleniyor…"
gcloud builds submit --config apps/api/cloudbuild.yaml \
  --substitutions "_IMAGE=${API_IMAGE}" --project "$PROJECT_ID" .

echo "▶ [2/4] Migration + seed uygulanıyor (Cloud Run Job)…"
# Seed idempotenttir (upsert): firma + admin kullanıcı + örnek ürünleri oluşturur.
gcloud run jobs deploy tignal-migrate --image "$API_IMAGE" --region "$REGION" \
  --project "$PROJECT_ID" --set-env-vars "DATABASE_URL=${DATABASE_URL}" \
  --command sh \
  --args "-c,pnpm --filter @tignal/db migrate:deploy && pnpm --filter @tignal/db seed" \
  --max-retries 1
gcloud run jobs execute tignal-migrate --region "$REGION" --project "$PROJECT_ID" --wait

echo "▶ [3/4] API Cloud Run'a deploy ediliyor…"
gcloud run deploy tignal-api --image "$API_IMAGE" --region "$REGION" \
  --project "$PROJECT_ID" --allow-unauthenticated --port 8080 \
  --set-env-vars "DATABASE_URL=${DATABASE_URL},JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET},JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET},E_INVOICE_PROVIDER=MOCK,NODE_ENV=production"
API_URL="$(gcloud run services describe tignal-api --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)')"
echo "  API_URL=$API_URL"

echo "▶ [4/4] Web imajı derlenip deploy ediliyor (API adresi gömülüyor)…"
gcloud builds submit --config apps/web/cloudbuild.yaml \
  --substitutions "_IMAGE=${WEB_IMAGE},_API_URL=${API_URL}" --project "$PROJECT_ID" .
gcloud run deploy tignal-web --image "$WEB_IMAGE" --region "$REGION" \
  --project "$PROJECT_ID" --allow-unauthenticated --port 8080
WEB_URL="$(gcloud run services describe tignal-web --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)')"

echo "▶ API CORS, web adresine güncelleniyor…"
gcloud run services update tignal-api --region "$REGION" --project "$PROJECT_ID" \
  --update-env-vars "WEB_ORIGIN=${WEB_URL}"

echo ""
echo "✅ Yayında!"
echo "   Web : $WEB_URL"
echo "   API : $API_URL/api"
echo "   Giriş: admin@tignal.local / Admin1234!"
