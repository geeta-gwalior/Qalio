#!/bin/bash
# GCP Cloud Run Automated Deployment Script for Qalio Platform

set -e

PROJECT_ID=${GCP_PROJECT_ID:-"qalio-production"}
REGION=${GCP_REGION:-"us-central1"}
REPOSITORY="qalio-repo"

echo "🚀 Starting Qalio GCP Cloud Run Deployment..."
echo "Project ID: $PROJECT_ID | Region: $REGION"

# 1. Enable Required GCP APIs
echo "📦 Enabling GCP Artifact Registry and Cloud Run APIs..."
gcloud services enable artifactregistry.googleapis.com run.googleapis.com --project="$PROJECT_ID" || true

# 2. Create Artifact Registry Repository if not exists
gcloud artifacts repositories describe "$REPOSITORY" --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1 || \
gcloud artifacts repositories create "$REPOSITORY" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Qalio Container Images" \
  --project="$PROJECT_ID"

# 3. Configure Docker Credentials
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/qalio-backend:latest"
FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/qalio-frontend:latest"

# 4. Build and Push Backend Image
echo "🔨 Building & Pushing Backend Image..."
docker build -t "$BACKEND_IMAGE" ./qalio-backend
docker push "$BACKEND_IMAGE"

# 5. Deploy Backend to GCP Cloud Run
echo "⚡ Deploying Backend Service to Cloud Run..."
gcloud run deploy qalio-backend \
  --image="$BACKEND_IMAGE" \
  --platform=managed \
  --region="$REGION" \
  --allow-unauthenticated \
  --port=4000 \
  --project="$PROJECT_ID"

BACKEND_URL=$(gcloud run services describe qalio-backend --platform=managed --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')
echo "✅ Backend Live at: $BACKEND_URL"

# 6. Build and Push Frontend Image
echo "🔨 Building & Pushing Frontend Image..."
docker build -t "$FRONTEND_IMAGE" ./qalio-frontend
docker push "$FRONTEND_IMAGE"

# 7. Deploy Frontend to GCP Cloud Run
echo "⚡ Deploying Frontend Service to Cloud Run..."
gcloud run deploy qalio-frontend \
  --image="$FRONTEND_IMAGE" \
  --platform=managed \
  --region="$REGION" \
  --allow-unauthenticated \
  --port=3000 \
  --set-env-vars="NEXT_PUBLIC_QALIO_BACKEND_URL=$BACKEND_URL/api" \
  --project="$PROJECT_ID"

FRONTEND_URL=$(gcloud run services describe qalio-frontend --platform=managed --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')

echo "🎉 Deployment Complete!"
echo "🌐 Qalio Frontend: $FRONTEND_URL"
echo "🌐 Qalio Backend API: $BACKEND_URL"
