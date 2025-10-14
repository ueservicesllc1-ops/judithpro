#!/bin/bash

# Script para actualizar Nginx con límite de 100MB para archivos

echo "🚀 Actualizando configuración de Nginx con límite de 100MB..."

# Copiar nueva configuración
sudo cp nginx-judith-config.conf /etc/nginx/sites-available/judith.life

# Verificar configuración
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuración válida, reiniciando Nginx..."
    sudo systemctl restart nginx
    echo "✅ Nginx reiniciado con límite de 100MB"
else
    echo "❌ Error en configuración de Nginx"
    exit 1
fi

echo "🎉 ¡Listo! Ahora puedes subir archivos de hasta 100MB"
