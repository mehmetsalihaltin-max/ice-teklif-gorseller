#!/usr/bin/env bash
# TİGNAL — Cloud Run + Cloud SQL ile TEK KOMUTLA deploy.
# Harici veritabanı (Neon) gerekmez; Cloud SQL'i kendisi kurar ve bağlar.
#
# Google Cloud Shell'de (telefondan tarayıcı) çalıştırmak için idealdir:
#   gcloud config set project PROJE_ID
#   bash deploy/cloudrun-cloudsql.sh
#
# Not: Cloud SQL db-f1-micro küçük bir aylık ücrete tabidir; kurulum ~5-10 dk sürer.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-europe-west1}"
REPO="${REPO:-tignal}"
DB_INSTANCE="${DB_INSTANCE:-tignal-db}"
DB_NAME="${DB_NAME:-tignal}"
JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-$(openssl rand -hex 32)}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-$(openssl rand -hex 32)}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 16)}"

[ -z "$PROJECT_ID" ] && { echo "PROJE bulunamadı: gcloud config set project PROJE_ID"; exit 1; }

AR="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"
API_IMAGE="${AR}/api:latest"
WEB_IMAGE="${AR}/web:latest"

echo "▶ Proje: $PROJECT_ID  Bölge: $REGION"
echo "▶ Gerekli API'ler etkinleştiriliyor…"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com sqladmin.googleapis.com --project "$PROJECT_ID"

echo "▶ Artifact Registry…"
gcloud artifacts repositories describe "$REPO" --location "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "$REPO" --repository-format=docker --location "$REGION" --project "$PROJECT_ID"

echo "▶ Cloud SQL (PostgreSQL 16) hazırlanıyor… (birkaç dakika)"
if ! gcloud sql instances describe "$DB_INSTANCE" --project "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud sql instances create "$DB_INSTANCE" --database-version=POSTGRES_16 \
    --tier=db-f1-micro --region="$REGION" --project "$PROJECT_ID"
fi
gcloud sql databases describe "$DB_NAME" --instance "$DB_INSTANCE" --project "$PROJECT_ID" >/dev/null 2>&1 || \
  gcloud sql databases create "$DB_NAME" --instance "$DB_INSTANCE" --project "$PROJECT_ID"
gcloud sql users set-password postgres --instance "$DB_INSTANCE" --password "$DB_PASSWORD" --project "$PROJECT_ID"

CONN="$(gcloud sql instances describe "$DB_INSTANCE" --project "$PROJECT_ID" --format 'value(connectionName)')"
# Cloud Run, Cloud SQL'e unix socket ile bağlanır.
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@localhost/${DB_NAME}?host=/cloudsql/${CONN}"

echo "▶ [1/4] API imajı derleniyor…"
gcloud builds submit --config apps/api/cloudbuild.yaml --substitutions "_IMAGE=${API_IMAGE}" --project "$PROJECT_ID" .

echo "▶ [2/4] Migration + seed (Cloud Run Job, Cloud SQL bağlı)…"
gcloud run jobs deploy tignal-migrate --image "$API_IMAGE" --region "$REGION" --project "$PROJECT_ID" \
  --set-cloudsql-instances "$CONN" --set-env-vars "DATABASE_URL=${DATABASE_URL}" \
  --command sh --args "-c,pnpm --filter @tignal/db migrate:deploy && pnpm --filter @tignal/db seed" --max-retries 1
gcloud run jobs execute tignal-migrate --region "$REGION" --project "$PROJECT_ID" --wait

echo "▶ [3/4] API deploy…"
gcloud run deploy tignal-api --image "$API_IMAGE" --region "$REGION" --project "$PROJECT_ID" \
  --allow-unauthenticated --port 8080 --add-cloudsql-instances "$CONN" \
  --set-env-vars "DATABASE_URL=${DATABASE_URL},JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET},JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET},E_INVOICE_PROVIDER=MOCK,NODE_ENV=production"
API_URL="$(gcloud run services describe tignal-api --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)')"
echo "  API_URL=$API_URL"

echo "▶ [4/4] Web imajı (API adresi gömülü) + deploy…"
gcloud builds submit --config apps/web/cloudbuild.yaml --substitutions "_IMAGE=${WEB_IMAGE},_API_URL=${API_URL}" --project "$PROJECT_ID" .
gcloud run deploy tignal-web --image "$WEB_IMAGE" --region "$REGION" --project "$PROJECT_ID" --allow-unauthenticated --port 8080
WEB_URL="$(gcloud run services describe tignal-web --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)')"

gcloud run services update tignal-api --region "$REGION" --project "$PROJECT_ID" --update-env-vars "WEB_ORIGIN=${WEB_URL}"

echo ""
echo "✅ Yayında!"
echo "   Web : $WEB_URL"
echo "   API : $API_URL/api"
echo "   Giriş: admin@tignal.local / Admin1234!"
echo "   (DB şifresi: $DB_PASSWORD  — bir yere not alın)"
