#!/bin/bash

# Script para configurar Nginx con SSL para judith.life

echo "🚀 Configurando Nginx con SSL para judith.life..."

# Instalar Nginx
sudo apt update
sudo apt install -y nginx

# Crear configuración de Nginx
sudo tee /etc/nginx/sites-available/judith.life > /dev/null <<EOF
server {
    listen 80;
    server_name judith.life www.judith.life;
    
    # Redirigir HTTP a HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name judith.life www.judith.life;
    
    # Configuración SSL (se configurará con Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/judith.life/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/judith.life/privkey.pem;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Proxy al frontend (puerto 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Proxy al backend (puerto 8000)
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Proxy al B2 (puerto 3001)
    location /b2/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Habilitar el sitio
sudo ln -sf /etc/nginx/sites-available/judith.life /etc/nginx/sites-enabled/

# Remover configuración por defecto
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Instalar Certbot para Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

echo "✅ Nginx configurado. Ahora ejecuta:"
echo "sudo certbot --nginx -d judith.life -d www.judith.life"
echo ""
echo "Esto configurará SSL automáticamente."
