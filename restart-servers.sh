#!/bin/bash

echo "🔄 Reiniciando servidores Judith..."

# Matar todos los procesos de Node.js
echo "🔪 Matando procesos de Node.js..."
pkill -f node
sleep 2

# Verificar que no queden procesos
REMAINING_NODES=$(pgrep -f node | wc -l)
if [ $REMAINING_NODES -gt 0 ]; then
    echo "⚠️  Aún hay $REMAINING_NODES procesos de Node.js, forzando terminación..."
    pkill -9 -f node
    sleep 1
fi

# Reiniciar servicios systemd
echo "🚀 Reiniciando servicios systemd..."

echo "   - Reiniciando judith-frontend..."
sudo systemctl restart judith-frontend

echo "   - Reiniciando judith-backend..."
sudo systemctl restart judith-backend

echo "   - Reiniciando judith-b2-proxy..."
sudo systemctl restart judith-b2-proxy

# Esperar un poco para que los servicios se inicien
echo "⏳ Esperando que los servicios se inicien..."
sleep 5

# Verificar estado de los servicios
echo "📊 Estado de los servicios:"
echo "   - judith-frontend: $(sudo systemctl is-active judith-frontend)"
echo "   - judith-backend: $(sudo systemctl is-active judith-backend)"
echo "   - judith-b2-proxy: $(sudo systemctl is-active judith-b2-proxy)"

# Verificar puertos
echo "🔌 Verificando puertos:"
echo "   - Puerto 3000 (Frontend): $(netstat -tlnp | grep :3000 | wc -l) procesos"
echo "   - Puerto 8000 (Backend): $(netstat -tlnp | grep :8000 | wc -l) procesos"
echo "   - Puerto 3001 (B2 Proxy): $(netstat -tlnp | grep :3001 | wc -l) procesos"

# Test rápido de conectividad
echo "🧪 Probando conectividad..."
echo "   - Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "ERROR")"
echo "   - Backend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health || echo "ERROR")"
echo "   - B2 Proxy: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "ERROR")"

echo "✅ Reinicio completado!"
echo "🌐 Accede a: https://judith.life"
