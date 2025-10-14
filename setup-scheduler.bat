@echo off
echo ==========================================
echo   Configurar Auto-Start/Stop VM
echo ==========================================
echo.

set PROJECT_ID=judith-app-474919
set ZONE=us-central1-c
set INSTANCE_NAME=judith-backend

echo Configurando proyecto: %PROJECT_ID%
gcloud config set project %PROJECT_ID%

echo.
echo Habilitando APIs necesarias...
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable compute.googleapis.com

echo.
echo Configurando permisos...
set SERVICE_ACCOUNT=compute-scheduler@%PROJECT_ID%.iam.gserviceaccount.com

REM Crear service account
gcloud iam service-accounts create compute-scheduler --display-name="Compute Scheduler Service Account" --project=%PROJECT_ID% 2>nul

REM Dar permisos
gcloud projects add-iam-policy-binding %PROJECT_ID% --member="serviceAccount:%SERVICE_ACCOUNT%" --role="roles/compute.instanceAdmin.v1"

echo.
echo Creando job para APAGAR a las 2am EST...
gcloud scheduler jobs create http stop-vm-2am --location=us-central1 --schedule="0 7 * * *" --time-zone="America/New_York" --uri="https://compute.googleapis.com/compute/v1/projects/%PROJECT_ID%/zones/%ZONE%/instances/%INSTANCE_NAME%/stop" --http-method=POST --oauth-service-account-email="%SERVICE_ACCOUNT%" --oauth-token-scope="https://www.googleapis.com/auth/compute" --description="Stop VM at 2am EST" 2>nul || echo Job ya existe

echo.
echo Creando job para ENCENDER a las 8am EST...
gcloud scheduler jobs create http start-vm-8am --location=us-central1 --schedule="0 13 * * *" --time-zone="America/New_York" --uri="https://compute.googleapis.com/compute/v1/projects/%PROJECT_ID%/zones/%ZONE%/instances/%INSTANCE_NAME%/start" --http-method=POST --oauth-service-account-email="%SERVICE_ACCOUNT%" --oauth-token-scope="https://www.googleapis.com/auth/compute" --description="Start VM at 8am EST" 2>nul || echo Job ya existe

echo.
echo ========================================
echo   Scheduler configurado exitosamente
echo ========================================
echo.
echo Horario:
echo   Apagar: 2am EST
echo   Encender: 8am EST
echo.
echo Ahorro estimado: ~$26/mes
echo   VM encendida: 18 horas/dia
echo   Costo: ~$80/mes vs $106 24/7
echo.
echo Ver jobs:
echo   gcloud scheduler jobs list --location=us-central1
echo.

pause

