#!/bin/bash

# =============================================================================
# Script de Conexión SSH a Judith - Google Cloud Compute Engine
# =============================================================================
# Este script permite a cualquier agente conectarse fácilmente al servidor
# 
# Autor: AI Assistant
# Fecha: $(date +%Y-%m-%d)
# =============================================================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración del servidor
PROJECT_ID="judith-app-474919"
INSTANCE_NAME="judithnew"
ZONE="us-central1-c"
EXTERNAL_IP="104.197.145.173"
USER="heavencoffee_us"

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}🚀 Script de Conexión SSH a Judith Server${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""

# Función para mostrar información del servidor
show_server_info() {
    echo -e "${YELLOW}📋 Información del Servidor:${NC}"
    echo -e "   • Proyecto: ${GREEN}$PROJECT_ID${NC}"
    echo -e "   • Instancia: ${GREEN}$INSTANCE_NAME${NC}"
    echo -e "   • Zona: ${GREEN}$ZONE${NC}"
    echo -e "   • IP Externa: ${GREEN}$EXTERNAL_IP${NC}"
    echo -e "   • Usuario: ${GREEN}$USER${NC}"
    echo ""
}

# Función para verificar estado del servidor
check_server_status() {
    echo -e "${YELLOW}🔍 Verificando estado del servidor...${NC}"
    
    if gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --format="value(status)" 2>/dev/null | grep -q "RUNNING"; then
        echo -e "   ✅ Servidor: ${GREEN}RUNNING${NC}"
        return 0
    else
        echo -e "   ❌ Servidor: ${RED}NOT RUNNING${NC}"
        return 1
    fi
}

# Función para verificar servicios
check_services() {
    echo -e "${YELLOW}🔧 Verificando servicios...${NC}"
    
    # Verificar backend
    if curl -s http://$EXTERNAL_IP:8000/health > /dev/null 2>&1; then
        echo -e "   ✅ Backend (puerto 8000): ${GREEN}ONLINE${NC}"
    else
        echo -e "   ❌ Backend (puerto 8000): ${RED}OFFLINE${NC}"
    fi
    
    # Verificar frontend
    if curl -s http://$EXTERNAL_IP:3000 > /dev/null 2>&1; then
        echo -e "   ✅ Frontend (puerto 3000): ${GREEN}ONLINE${NC}"
    else
        echo -e "   ❌ Frontend (puerto 3000): ${RED}OFFLINE${NC}"
    fi
    
    # Verificar proxy B2
    if curl -s http://$EXTERNAL_IP:3001/api/health > /dev/null 2>&1; then
        echo -e "   ✅ B2 Proxy (puerto 3001): ${GREEN}ONLINE${NC}"
    else
        echo -e "   ❌ B2 Proxy (puerto 3001): ${RED}OFFLINE${NC}"
    fi
}

# Función para mostrar comandos útiles
show_useful_commands() {
    echo -e "${YELLOW}🛠️  Comandos Útiles:${NC}"
    echo -e "   • Ver logs backend:     ${BLUE}sudo journalctl -u judith-backend -f${NC}"
    echo -e "   • Ver logs frontend:    ${BLUE}sudo journalctl -u judith-frontend -f${NC}"
    echo -e "   • Reiniciar backend:    ${BLUE}sudo systemctl restart judith-backend${NC}"
    echo -e "   • Reiniciar frontend:   ${BLUE}sudo systemctl restart judith-frontend${NC}"
    echo -e "   • Ver estado servicios: ${BLUE}sudo systemctl status judith-*${NC}"
    echo -e "   • Ver procesos:         ${BLUE}ps aux | grep -E '(python|node|nginx)'${NC}"
    echo ""
}

# Función para conectar por SSH
connect_ssh() {
    echo -e "${YELLOW}🔐 Conectando por SSH...${NC}"
    echo -e "   Comando: ${BLUE}gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID${NC}"
    echo ""
    
    # Conectar por SSH
    gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID
}

# Función principal
main() {
    show_server_info
    
    # Verificar si gcloud está configurado
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ Error: gcloud CLI no está instalado${NC}"
        echo -e "   Instala Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # Verificar autenticación
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
        echo -e "${YELLOW}⚠️  No hay autenticación activa${NC}"
        echo -e "   Ejecuta: ${BLUE}gcloud auth login${NC}"
        exit 1
    fi
    
    # Verificar estado del servidor
    if ! check_server_status; then
        echo -e "${RED}❌ El servidor no está corriendo${NC}"
        exit 1
    fi
    
    echo ""
    check_services
    echo ""
    show_useful_commands
    
    # Preguntar si quiere conectar
    echo -e "${YELLOW}¿Quieres conectar por SSH? (y/n):${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        connect_ssh
    else
        echo -e "${GREEN}👋 ¡Hasta luego!${NC}"
    fi
}

# Ejecutar función principal
main "$@"
