#!/bin/bash

echo ""
echo " ========================================"
echo "  OfflineScribe — One-Click Setup"
echo " ========================================"
echo ""

# Step 1 — Check Python
echo "[1/6] Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo ""
    echo " ERROR: Python 3 is not installed."
    echo " Please install Python 3.13+ from https://python.org"
    echo " or use your system package manager:"
    echo "   macOS:  brew install python3"
    echo "   Ubuntu: sudo apt install python3 python3-pip python3-venv"
    echo ""
    exit 1
fi
echo " Python found: $(python3 --version)"

# Step 2 — Check ffmpeg
echo ""
echo "[2/6] Checking ffmpeg installation..."
if ! command -v ffmpeg &> /dev/null; then
    echo ""
    echo " WARNING: ffmpeg is not found."
    echo " OfflineScribe requires ffmpeg to extract audio from video files."
    echo " Install it using:"
    echo "   macOS:  brew install ffmpeg"
    echo "   Ubuntu: sudo apt install ffmpeg"
    echo ""
    echo " Setup will continue, but transcription will not work without ffmpeg."
    echo ""
    read -p " Press Enter to continue..."
else
    echo " ffmpeg found."
fi

# Step 3 — Create virtual environment
echo ""
echo "[3/6] Creating virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo " ERROR: Failed to create virtual environment."
    exit 1
fi
echo " Virtual environment created."

# Step 4 — Install dependencies
echo ""
echo "[4/6] Installing dependencies (this may take a few minutes)..."
source venv/bin/activate
pip install -r requirements.txt --quiet
if [ $? -ne 0 ]; then
    echo " ERROR: Failed to install dependencies."
    exit 1
fi
echo " Dependencies installed."

# Step 5 — Generate .env with SECRET_KEY
echo ""
echo "[5/6] Setting up environment variables..."
if [ -f .env ]; then
    echo " .env already exists. Skipping SECRET_KEY generation."
else
    cp .env.example .env
    python3 -c "
from django.core.management.utils import get_random_secret_key
key = get_random_secret_key()
content = open('.env').read().replace('your-secret-key-here', key)
open('.env', 'w').write(content)
"
    echo " .env created with generated SECRET_KEY."
fi

# Step 6 — Run migrations
echo ""
echo "[6/6] Setting up database..."
python3 manage.py migrate --run-syncdb > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo " ERROR: Database migration failed."
    exit 1
fi
echo " Database ready."

# Done
echo ""
echo " ========================================"
echo "  Setup Complete!"
echo " ========================================"
echo ""
echo " To start OfflineScribe:"
echo ""
echo "   1. Run: source venv/bin/activate"
echo "   2. Run: python3 manage.py runserver"
echo "   3. Open: http://127.0.0.1:8000"
echo ""
echo " NOTE: The first time you transcribe a file,"
echo " faster-whisper will download the selected model."
echo " This is a one-time download per model."
echo ""