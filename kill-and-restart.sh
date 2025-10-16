#!/bin/bash

# Script simple para matar Node.js y reiniciar servicios
echo "🔪 Matando procesos Node.js..."
pkill -f node
sleep 2

echo "🚀 Reiniciando servicios..."
sudo systemctl restart judith-frontend
sudo systemctl restart judith-backend  
sudo systemctl restart judith-b2-proxy

echo "✅ Listo! Servidores reiniciados"
