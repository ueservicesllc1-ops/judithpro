@echo off
echo ========================================
echo   Deploy to Google Compute Engine
echo ========================================
echo.

set VM_IP=34.135.41.116
set VM_USER=heavencoffee_us

echo 🚀 Conectando a VM: %VM_IP%
echo.

REM Commit y push cambios a GitHub primero
echo 📤 Haciendo push de cambios a GitHub...
git add .
git commit -m "Update: Deploy to Compute Engine" || echo No hay cambios para commit
git push origin google-cloud-deploy

echo.
echo 📋 INSTRUCCIONES:
echo.
echo 1. Conectar a la VM por SSH:
echo    gcloud compute ssh %VM_USER%@judith-backend --zone=us-central1-c
echo.
echo 2. En la VM, ejecutar estos comandos en orden:
echo.
echo    # Primer setup (solo la primera vez):
echo    wget https://raw.githubusercontent.com/ueservicesllc1-ops/judithpro/google-cloud-deploy/setup-compute-engine.sh
echo    chmod +x setup-compute-engine.sh
echo    bash setup-compute-engine.sh
echo.
echo    # Configurar servicios:
echo    wget https://raw.githubusercontent.com/ueservicesllc1-ops/judithpro/google-cloud-deploy/setup-services.sh
echo    chmod +x setup-services.sh
echo    sudo bash setup-services.sh
echo.
echo    # Configurar firewall:
echo    wget https://raw.githubusercontent.com/ueservicesllc1-ops/judithpro/google-cloud-deploy/setup-firewall.sh
echo    chmod +x setup-firewall.sh
echo    sudo bash setup-firewall.sh
echo.
echo 3. Configurar reglas de firewall en Google Cloud Console o ejecutar:
echo    gcloud compute firewall-rules create allow-judith-frontend --allow tcp:3000 --source-ranges 0.0.0.0/0
echo.
echo 4. Tu app estará disponible en:
echo    http://%VM_IP%:3000
echo.

pause

