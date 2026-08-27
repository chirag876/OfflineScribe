@echo off
title OfflineScribe Setup
color 0F

echo.
echo  ========================================
echo   OfflineScribe — One-Click Setup
echo  ========================================
echo.

REM Step 1 — Check Python
echo [1/6] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: Python is not installed or not in PATH.
    echo  Please install Python 3.13+ from https://python.org
    echo  Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)
echo  Python found.

REM Step 2 — Check ffmpeg
echo.
echo [2/6] Checking ffmpeg installation...
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  WARNING: ffmpeg is not found in PATH.
    echo  OfflineScribe requires ffmpeg to extract audio from video files.
    echo  Please install ffmpeg from https://ffmpeg.org/download.html
    echo  and add it to your system PATH before using the application.
    echo.
    echo  Setup will continue, but transcription will not work without ffmpeg.
    echo.
    pause
)

REM Step 3 — Create virtual environment
echo.
echo [3/6] Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo  ERROR: Failed to create virtual environment.
    pause
    exit /b 1
)
echo  Virtual environment created.

REM Step 4 — Install dependencies
echo.
echo [4/6] Installing dependencies (this may take a few minutes)...
call venv\Scripts\activate
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo  ERROR: Failed to install dependencies.
    pause
    exit /b 1
)
echo  Dependencies installed.

REM Step 5 — Generate .env with SECRET_KEY
echo.
echo [5/6] Setting up environment variables...
if exist .env (
    echo  .env already exists. Skipping SECRET_KEY generation.
) else (
    copy .env.example .env >nul
    python -c "from django.core.management.utils import get_random_secret_key; key = get_random_secret_key(); lines = open('.env').read().replace('your-secret-key-here', key); open('.env', 'w').write(lines)"
    echo  .env created with generated SECRET_KEY.
)

REM Step 6 — Run migrations
echo.
echo [6/6] Setting up database...
python manage.py migrate --run-syncdb >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Database migration failed.
    pause
    exit /b 1
)
echo  Database ready.

REM Done
echo.
echo  ========================================
echo   Setup Complete!
echo  ========================================
echo.
echo  To start OfflineScribe:
echo.
echo    1. Open terminal in this folder
echo    2. Run: venv\Scripts\activate
echo    3. Run: python manage.py runserver
echo    4. Open: http://127.0.0.1:8000
echo.
echo  NOTE: The first time you transcribe a file,
echo  faster-whisper will download the selected model.
echo  This is a one-time download per model.
echo.
pause