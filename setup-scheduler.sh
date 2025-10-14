#!/bin/bash
# Script para configurar apagado/encendido automático de VM

set -e

echo "=========================================="
echo "  Configurando Auto-Start/Stop VM"
echo "=========================================="
echo ""

PROJECT_ID="judith-app-474919"
ZONE="us-central1-c"
INSTANCE_NAME="judith-backend"

# Configurar proyecto
gcloud config set project $PROJECT_ID

# Habilitar Cloud Scheduler API
echo "📡 Habilitando Cloud Scheduler API..."
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable compute.googleapis.com

# Crear rol para Cloud Scheduler
echo "🔐 Configurando permisos..."
SERVICE_ACCOUNT="compute-scheduler@${PROJECT_ID}.iam.gserviceaccount.com"

# Crear service account si no existe
gcloud iam service-accounts create compute-scheduler \
  --display-name="Compute Scheduler Service Account" \
  --project=${PROJECT_ID} || echo "Service account ya existe"

# Dar permisos para iniciar/detener instancias
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/compute.instanceAdmin.v1"

# Crear job para APAGAR a las 2am EST (7am UTC en horario estándar)
echo ""
echo "🌙 Creando job para APAGAR a las 2am EST..."
gcloud scheduler jobs create http stop-vm-2am \
  --location=us-central1 \
  --schedule="0 7 * * *" \
  --time-zone="America/New_York" \
  --uri="https://compute.googleapis.com/compute/v1/projects/${PROJECT_ID}/zones/${ZONE}/instances/${INSTANCE_NAME}/stop" \
  --http-method=POST \
  --oauth-service-account-email="${SERVICE_ACCOUNT}" \
  --oauth-token-scope="https://www.googleapis.com/auth/compute" \
  --description="Stop VM at 2am EST" \
  || echo "Job stop-vm-2am ya existe"

# Crear job para ENCENDER a las 8am EST (1pm UTC en horario estándar)
echo ""
echo "☀️ Creando job para ENCENDER a las 8am EST..."
gcloud scheduler jobs create http start-vm-8am \
  --location=us-central1 \
  --schedule="0 13 * * *" \
  --time-zone="America/New_York" \
  --uri="https://compute.googleapis.com/compute/v1/projects/${PROJECT_ID}/zones/${ZONE}/instances/${INSTANCE_NAME}/start" \
  --http-method=POST \
  --oauth-service-account-email="${SERVICE_ACCOUNT}" \
  --oauth-token-scope="https://www.googleapis.com/auth/compute" \
  --description="Start VM at 8am EST" \
  || echo "Job start-vm-8am ya existe"

echo ""
echo "✅ ¡Scheduler configurado!"
echo ""
echo "📋 Horario:"
echo "   🌙 Apagar: 2am EST (7am UTC)"
echo "   ☀️ Encender: 8am EST (1pm UTC)"
echo ""
echo "💰 Ahorro estimado: ~$26/mes"
echo "   - VM encendida: 18 horas/día"
echo "   - Costo: ~$80/mes (vs $106 24/7)"
echo ""
echo "📊 Ver jobs:"
echo "   gcloud scheduler jobs list --location=us-central1"
echo ""
echo "🗑️ Para eliminar:"
echo "   gcloud scheduler jobs delete stop-vm-2am --location=us-central1"
echo "   gcloud scheduler jobs delete start-vm-8am --location=us-central1"
echo ""

