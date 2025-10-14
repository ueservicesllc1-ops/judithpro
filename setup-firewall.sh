#!/bin/bash
# Script para configurar firewall en Compute Engine

set -e

echo "=========================================="
echo "  Configurando Firewall"
echo "=========================================="
echo ""

# Configurar firewall local (ufw)
echo "🔒 Configurando firewall local..."
sudo apt-get install -y ufw

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir puertos de la app
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp

# Habilitar firewall
echo "y" | sudo ufw enable

# Ver estado
sudo ufw status

echo ""
echo "✅ Firewall local configurado!"
echo ""
echo "⚠️  IMPORTANTE: También debes configurar las reglas de firewall en Google Cloud Console:"
echo ""
echo "   1. Ve a: VPC Network > Firewall > Create Firewall Rule"
echo "   2. Crear regla para HTTP (puerto 3000):"
echo "      - Name: allow-judith-frontend"
echo "      - Targets: All instances in the network"
echo "      - Source IP ranges: 0.0.0.0/0"
echo "      - Protocols and ports: tcp:3000"
echo ""
echo "   3. Crear regla para Backend (puerto 8000 - opcional, solo si necesitas acceso directo):"
echo "      - Name: allow-judith-backend"
echo "      - Targets: All instances in the network"
echo "      - Source IP ranges: 0.0.0.0/0"
echo "      - Protocols and ports: tcp:8000"
echo ""
echo "   O ejecuta estos comandos en Cloud Shell:"
echo ""
echo "   gcloud compute firewall-rules create allow-judith-frontend \\"
echo "     --allow tcp:3000 \\"
echo "     --source-ranges 0.0.0.0/0 \\"
echo "     --description 'Allow Judith frontend access'"
echo ""

