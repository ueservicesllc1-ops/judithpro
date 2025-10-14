@echo off
echo Actualizando Nginx con limite de 100MB...
echo.
echo Ejecuta estos comandos en el servidor:
echo.
echo 1. Copiar nueva configuracion:
echo    sudo cp nginx-judith-config.conf /etc/nginx/sites-available/judith.life
echo.
echo 2. Verificar configuracion:
echo    sudo nginx -t
echo.
echo 3. Reiniciar Nginx:
echo    sudo systemctl restart nginx
echo.
echo Despues de esto, podras subir archivos de hasta 100MB!
