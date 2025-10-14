@echo off
echo Configurando Nginx con SSL para judith.life...
echo.
echo Ejecuta estos comandos en el servidor:
echo.
echo 1. Instalar Nginx:
echo    sudo apt update
echo    sudo apt install -y nginx
echo.
echo 2. Crear configuracion:
echo    sudo nano /etc/nginx/sites-available/judith.life
echo.
echo 3. Habilitar sitio:
echo    sudo ln -sf /etc/nginx/sites-available/judith.life /etc/nginx/sites-enabled/
echo    sudo rm -f /etc/nginx/sites-enabled/default
echo.
echo 4. Instalar Certbot:
echo    sudo apt install -y certbot python3-certbot-nginx
echo.
echo 5. Configurar SSL:
echo    sudo certbot --nginx -d judith.life -d www.judith.life
echo.
echo 6. Reiniciar Nginx:
echo    sudo systemctl restart nginx
echo    sudo systemctl enable nginx
echo.
echo Despues de esto, judith.life tendra HTTPS automatico!
