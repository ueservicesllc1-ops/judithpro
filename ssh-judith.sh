#!/bin/bash

# =============================================================================
# Conexión SSH Directa a Judith Server
# =============================================================================
# Script simple para conectar directamente por SSH
# 
# Uso: ./ssh-judith.sh [comando_opcional]
# =============================================================================

# Configuración
PROJECT_ID="judith-app-474919"
INSTANCE_NAME="judithnew"
ZONE="us-central1-c"

echo "🚀 Conectando a Judith Server..."
echo "📋 Proyecto: $PROJECT_ID"
echo "🖥️  Instancia: $INSTANCE_NAME"
echo "🌍 Zona: $ZONE"
echo ""

# Si se pasa un comando, ejecutarlo directamente
if [ $# -gt 0 ]; then
    echo "▶️  Ejecutando comando: $*"
    gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --command="$*"
else
    echo "🔐 Conectando por SSH..."
    gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID
fi
