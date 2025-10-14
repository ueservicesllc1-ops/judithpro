@echo off
echo ========================================
echo   Google Cloud Run Deploy Script
echo ========================================
echo.

REM Configuración
set PROJECT_ID=judith-app-2024
set SERVICE_NAME=judith-app
set REGION=us-central1

echo 🔐 Verificando autenticación de Google Cloud...
gcloud auth list

echo.
echo 📋 Configurando proyecto: %PROJECT_ID%
gcloud config set project %PROJECT_ID%

echo.
echo 📡 Habilitando APIs necesarias...
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

echo.
echo 🔨 Construyendo imagen Docker (esto puede tardar 15-20 minutos)...
echo    - Usando Dockerfile.cloudrun
echo    - Instalando Node.js, Python, Demucs, Torch...
gcloud builds submit --tag gcr.io/%PROJECT_ID%/%SERVICE_NAME% --timeout=3600s --dockerfile=Dockerfile.cloudrun .

if %ERRORLEVEL% neq 0 (
    echo ❌ Error en el build. Verifica los logs arriba.
    pause
    exit /b 1
)

echo.
echo 🚀 Desplegando a Cloud Run...
echo    - Memoria: 8 GB
echo    - CPU: 4 cores
echo    - Timeout: 15 minutos
gcloud run deploy %SERVICE_NAME% ^
  --image gcr.io/%PROJECT_ID%/%SERVICE_NAME% ^
  --platform managed ^
  --region %REGION% ^
  --allow-unauthenticated ^
  --port 3000 ^
  --memory 8Gi ^
  --cpu 4 ^
  --max-instances 10 ^
  --timeout 900 ^
  --concurrency 4 ^
  --set-env-vars NODE_ENV=production,PORT=3000,NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000

if %ERRORLEVEL% neq 0 (
    echo ❌ Error en el deploy. Verifica los logs arriba.
    pause
    exit /b 1
)

echo.
echo ✅ ¡Deploy completado exitosamente!
echo.
echo 🌐 Tu aplicación está disponible en:
gcloud run services describe %SERVICE_NAME% --platform managed --region %REGION% --format "value(status.url)"

echo.
echo 📊 Para ver logs en tiempo real:
echo    gcloud run logs tail %SERVICE_NAME% --region %REGION%
echo.

pause

