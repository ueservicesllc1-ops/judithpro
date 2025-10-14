#!/bin/bash
# Script para configurar servicios systemd en Compute Engine

set -e

echo "=========================================="
echo "  Configurando servicios systemd"
echo "=========================================="
echo ""

# Crear servicio para backend Python
echo "🔧 Creando servicio judith-backend..."
sudo tee /etc/systemd/system/judith-backend.service > /dev/null << 'EOF'
[Unit]
Description=Judith Backend (FastAPI)
After=network.target

[Service]
Type=simple
User=heavencoffee_us
WorkingDirectory=/home/heavencoffee_us/judithpro
Environment="PATH=/home/heavencoffee_us/judithpro/venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/home/heavencoffee_us/judithpro/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
WorkingDirectory=/home/heavencoffee_us/judithpro/backend
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Crear servicio para frontend Next.js
echo "🔧 Creando servicio judith-frontend..."
sudo tee /etc/systemd/system/judith-frontend.service > /dev/null << 'EOF'
[Unit]
Description=Judith Frontend (Next.js)
After=network.target judith-backend.service

[Service]
Type=simple
User=heavencoffee_us
WorkingDirectory=/home/heavencoffee_us/judithpro
Environment="NODE_ENV=production"
Environment="PORT=3000"
Environment="NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd
echo "🔄 Recargando systemd..."
sudo systemctl daemon-reload

# Habilitar servicios
echo "✅ Habilitando servicios..."
sudo systemctl enable judith-backend
sudo systemctl enable judith-frontend

# Iniciar servicios
echo "🚀 Iniciando servicios..."
sudo systemctl start judith-backend
sudo systemctl start judith-frontend

# Esperar un poco
sleep 5

# Ver estado
echo ""
echo "📊 Estado de los servicios:"
echo ""
echo "Backend:"
sudo systemctl status judith-backend --no-pager
echo ""
echo "Frontend:"
sudo systemctl status judith-frontend --no-pager

echo ""
echo "✅ Servicios configurados!"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs backend:  sudo journalctl -u judith-backend -f"
echo "   Ver logs frontend: sudo journalctl -u judith-frontend -f"
echo "   Reiniciar backend: sudo systemctl restart judith-backend"
echo "   Reiniciar frontend: sudo systemctl restart judith-frontend"
echo ""

