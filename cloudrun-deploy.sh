#!/bin/bash
# Script para deploy automático en Google Cloud Run
# Ejecutar en Google Cloud Shell

echo "🚀 Configurando Google Cloud Run para Judith App..."

# Configurar proyecto
PROJECT_ID="judith-app-2024"
gcloud config set project $PROJECT_ID

# Habilitar APIs necesarias
echo "📡 Habilitando APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Clonar el repositorio (cambiar por tu repo)
echo "📥 Clonando repositorio..."
# git clone https://github.com/tu-usuario/moisesclone.git
# cd moisesclone

# O subir archivos manualmente a Cloud Shell

# Build la imagen
echo "🔨 Construyendo imagen Docker..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/judith-app

# Deploy a Cloud Run
echo "🚀 Desplegando a Cloud Run..."
gcloud run deploy judith-app \
  --image gcr.io/$PROJECT_ID/judith-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 8Gi \
  --cpu 4 \
  --max-instances 10 \
  --timeout 900 \
  --concurrency 4 \
  --set-env-vars NODE_ENV=production,PORT=3000,NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000

echo "✅ ¡Deploy completado!"
echo "🌐 Tu app estará disponible en:"
gcloud run services describe judith-app --platform managed --region us-central1 --format 'value(status.url)'
