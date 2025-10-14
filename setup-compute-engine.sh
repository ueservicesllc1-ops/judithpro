#!/bin/bash
# Script para configurar Google Compute Engine VM
# Ejecutar EN LA VM después de conectarse por SSH

set -e

echo "=========================================="
echo "  Judith App - Compute Engine Setup"
echo "=========================================="
echo ""

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt-get update
sudo apt-get upgrade -y

# Instalar Node.js 18
echo "📦 Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Python y dependencias de compilación
echo "📦 Instalando Python y dependencias..."
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    python3-dev \
    libffi-dev \
    libssl-dev \
    cmake \
    llvm \
    gfortran \
    libopenblas-dev \
    liblapack-dev \
    libblas-dev \
    ffmpeg \
    git

# Configurar Git
echo "🔧 Configurando Git..."
git config --global user.name "Judith Backend"
git config --global user.email "heavencoffee.us@gmail.com"

# Clonar repositorio
echo "📥 Clonando repositorio judithpro..."
cd ~
if [ -d "judithpro" ]; then
    echo "⚠️  Directorio judithpro ya existe, actualizando..."
    cd judithpro
    git fetch origin
    git checkout google-cloud-deploy
    git pull origin google-cloud-deploy
else
    git clone https://github.com/ueservicesllc1-ops/judithpro.git
    cd judithpro
    git checkout google-cloud-deploy
fi

# Instalar dependencias de Node
echo "📦 Instalando dependencias de Node.js..."
npm install

# Build Next.js
echo "🔨 Building Next.js..."
npm run build

# Crear virtual environment de Python
echo "🐍 Creando virtual environment de Python..."
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias de Python
echo "📦 Instalando dependencias de Python (esto tardará ~10-15 minutos)..."
pip install --upgrade pip setuptools wheel

# Instalar en orden
pip install --timeout 600 --retries 3 "setuptools>=70.0.0" "wheel>=0.42.0" "Cython>=3.0.0"
pip install --timeout 600 --retries 3 fastapi==0.104.1 uvicorn[standard]==0.24.0 python-multipart==0.0.6
pip install --timeout 600 --retries 3 "numpy>=2.0.0" "scipy>=1.15.0"
pip install --timeout 900 --retries 3 librosa==0.11.0
pip install --timeout 600 --retries 3 soundfile==0.12.1 pydub==0.25.1 ffmpeg-python==0.2.0
pip install --timeout 900 --retries 3 --extra-index-url https://download.pytorch.org/whl/cpu torch==2.0.0+cpu torchaudio==2.0.0+cpu
pip install --timeout 600 --retries 3 demucs>=4.0.0
pip install --timeout 600 --retries 3 aiofiles==23.2.1 "aiohttp>=3.8.0" httpx pydantic requests yt-dlp python-dotenv

# Crear directorios
echo "📁 Creando directorios..."
mkdir -p uploads temp_conversion temp_analysis backend/uploads

# Configurar variables de entorno
echo "🔧 Configurando variables de entorno..."
cat > .env.production << EOF
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
EOF

echo ""
echo "✅ ¡Instalación completada!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Configurar servicios systemd: sudo bash setup-services.sh"
echo "   2. Configurar firewall: sudo bash setup-firewall.sh"
echo ""

