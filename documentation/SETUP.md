# OfflineScribe — Complete Setup Guide

This document covers two paths:

- **Quick Setup** — Just want to use the app? Run a single script and you're done.
- **Manual Setup** — Want to understand every step, or learn how to set up a Django project from scratch? Follow the full guide below.

---

## Quick Setup (Recommended for most users)

> Prerequisites: Python 3.13+ and ffmpeg must already be installed on your system.
> See [Python Setup](#2-python-setup) and [ffmpeg Setup](#4-ffmpeg-setup) if you haven't installed them yet.

### Windows

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/OfflineScribe.git
cd OfflineScribe

# 2. Double-click setup.bat
#    OR run it from terminal:
setup.bat
```

### macOS / Linux

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/OfflineScribe.git
cd OfflineScribe

# 2. Make the script executable and run it
chmod +x setup.sh
./setup.sh
```

The script will automatically:
- Create a virtual environment
- Install all dependencies
- Generate a secure `SECRET_KEY`
- Set up the database

After setup completes, start the app:

```bash
# Windows
venv\Scripts\activate
python manage.py runserver

# macOS / Linux
source venv/bin/activate
python3 manage.py runserver
```

Open `http://127.0.0.1:8000` in your browser.

> **First transcription note:** faster-whisper will download the selected model on first use (Tiny ~75MB, Small ~460MB, Medium ~1.5GB). This is a one-time download per model.

---

## Manual Setup (Full Guide)

This document covers everything you need to get OfflineScribe running from scratch on a Windows machine Python setup, VS Code configuration, ffmpeg installation, Django project setup, and a full explanation of every dependency and configuration file.

---

## Table of Contents

1. [Prerequisites Overview](#1-prerequisites-overview)
2. [Python Setup](#2-python-setup)
3. [VS Code Setup](#3-vs-code-setup)
4. [ffmpeg Setup](#4-ffmpeg-setup)
5. [Project Setup](#5-project-setup)
6. [Virtual Environment](#6-virtual-environment)
7. [Installing Dependencies](#7-installing-dependencies)
8. [Django Project Initialization](#8-django-project-initialization)
9. [Environment Variables (.env)](#9-environment-variables-env)
10. [Settings.py Explained](#10-settingspy-explained)
11. [Running the Application](#11-running-the-application)

---

## 1. Prerequisites Overview

Before starting, you need the following installed on your machine:

| Tool | Minimum Version | Purpose |
|---|---|---|
| Python | 3.13+ | Core language the application runs on |
| VS Code | Latest | Code editor with Django and Python support |
| ffmpeg | Any recent build | Audio extraction from video/audio files |
| Git | Any | Version control |

---

## 2. Python Setup

### Download and Install

1. Go to [https://python.org/downloads](https://python.org/downloads)
2. Download **Python 3.13** (or latest 3.13.x)
3. Run the installer
4. ⚠️ **Important**: On the first screen of the installer, check **"Add Python to PATH"** before clicking Install Now. If you skip this, Python commands will not work in your terminal.

### Verify Installation

Open Command Prompt or PowerShell and run:

```bash
python --version
```

Expected output:
```
Python 3.13.x
```

```bash
pip --version
```

Expected output:
```
pip 24.x.x from ... (python 3.13)
```

> **What is pip?** pip is Python's package manager. It lets you install third-party libraries that your project depends on. Every library used in this project is installed via pip.

---

## 3. VS Code Setup

### Download and Install

1. Go to [https://code.visualstudio.com](https://code.visualstudio.com)
2. Download and install for Windows

### Recommended Extensions

Install these extensions from VS Code's Extensions panel (Ctrl+Shift+X):

| Extension | Why |
|---|---|
| **Python** (Microsoft) | Python language support, IntelliSense, linting |
| **Django** (Baptiste Darthenay) | Django template syntax highlighting |
| **Pylance** | Fast Python type checking and autocomplete |
| **GitLens** | Better Git integration |

### Select Python Interpreter

After opening the project folder in VS Code:
1. Press `Ctrl+Shift+P`
2. Type `Python: Select Interpreter`
3. Choose the interpreter inside your `venv` folder: `.\venv\Scripts\python.exe`

This ensures VS Code uses the project's virtual environment and not your global Python.

---

## 4. ffmpeg Setup

ffmpeg is a command-line tool that handles audio and video processing. OfflineScribe uses it to extract the audio track from uploaded video files.

### Download

1. Go to [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)
2. Under **Windows**, click **Windows builds from gyan.dev**
3. Download the latest **release full** zip (e.g., `ffmpeg-7.x-full_build.zip`)
4. Extract the zip to a permanent location recommended: `C:\ffmpeg\`

After extraction your folder should look like:
```
C:\ffmpeg\
├── bin\
│   ├── ffmpeg.exe      ← this is the main tool
│   ├── ffprobe.exe
│   └── ffplay.exe
├── doc\
└── presets\
```

### Add ffmpeg to System PATH

Adding to PATH means you can type `ffmpeg` in any terminal and Windows knows where to find it.

1. Press `Windows + S` and search for **"Edit the system environment variables"**
2. Click **Environment Variables**
3. Under **System variables**, find and click **Path**, then click **Edit**
4. Click **New** and add: `C:\ffmpeg\bin`
5. Click **OK** on all dialogs
6. **Restart your terminal** (important existing terminals won't pick up the change)

### Verify ffmpeg Installation

```bash
ffmpeg -version
```

Expected output starts with:
```
ffmpeg version 7.x Copyright (c) ...
```

> **What happens if ffmpeg is not in PATH?** OfflineScribe calls ffmpeg via Python's `subprocess` module using the command `ffmpeg`. If ffmpeg is not in PATH, Python cannot find the executable and audio extraction will fail for every file, returning an error.

---

## 5. Project Setup

### Clone the Repository

```bash
git clone https://github.com/yourusername/OfflineScribe.git
cd OfflineScribe
```

Or if you are setting it up manually, create the project folder:

```bash
mkdir OfflineScribe
cd OfflineScribe
```

---

## 6. Virtual Environment

A virtual environment is an isolated Python environment for your project. It keeps this project's dependencies separate from your global Python installation, preventing version conflicts between different projects.

### Create Virtual Environment

```bash
python -m venv venv
```

> **What does this do?** Creates a `venv/` folder inside your project that contains a copy of Python and an isolated pip. All libraries you install will go into this folder, not your global Python.

> **What if you skip this?** You can install libraries globally, but this causes problems when different projects need different versions of the same library. Virtual environments are a best practice and are expected in every professional Python project.

### Activate Virtual Environment

**Command Prompt:**
```bash
venv\Scripts\activate
```

**PowerShell:**
```bash
venv\Scripts\Activate.ps1
```

After activation, your terminal prompt will show `(venv)` as a prefix:
```
(venv) PS D:\OfflineScribe>
```

> **Important:** You must activate the virtual environment every time you open a new terminal before running any project commands. If `(venv)` is not showing, the environment is not active.

---

## 7. Installing Dependencies

Install all required libraries one by one:

### Django

```bash
pip install django
```

**What is Django?** Django is a high-level Python web framework that provides URL routing, an ORM (Object Relational Mapper) for database operations, a templating engine for HTML rendering, file upload handling, and a development server. It lets you build a fully functional web application without writing boilerplate infrastructure code.

**Why Django and not FastAPI or Flask?** Django was chosen because it comes with everything built-in ORM, file handling, admin, migrations which is ideal for a tool like OfflineScribe that needs database-backed job tracking and file management without extra setup.

---

### faster-whisper

```bash
pip install faster-whisper
```

**What is faster-whisper?** faster-whisper is an optimized implementation of OpenAI's Whisper speech-to-text model using CTranslate2 as its inference engine. It is 4x faster than the original Whisper implementation and uses significantly less memory, while producing the same or better accuracy.

**Why not OpenAI's Whisper directly?** OpenAI's Whisper is slower and heavier. faster-whisper runs efficiently on CPU with `int8` quantization, making it practical for local use without a GPU.

**Note:** The first time you run a transcription, faster-whisper will automatically download the selected model (Tiny ~75MB, Small ~460MB, Medium ~1.5GB) from HuggingFace Hub and cache it at `C:\Users\<YourName>\.cache\huggingface\hub\`. Subsequent runs use the cached model.

---

### Whitenoise

```bash
pip install whitenoise
```

**What is Whitenoise?** Whitenoise is a Python library that allows Django to serve its own static files (CSS, JavaScript, images) efficiently without needing a separate web server like Nginx or Apache.

**Why is this needed?** By default, Django's development server serves static files, but this is not efficient and Django itself recommends using a dedicated static file server in production. Whitenoise bridges this gap cleanly and is the recommended solution for Django apps that need to serve their own static files.

---

### python-dotenv

```bash
pip install python-dotenv
```

**What is python-dotenv?** python-dotenv reads key-value pairs from a `.env` file and loads them as environment variables so they can be accessed via `os.getenv()` in Python code.

**Why is this needed?** Django requires a `SECRET_KEY` for cryptographic signing of sessions and tokens. This key must never be committed to version control. python-dotenv lets you store it in a `.env` file that is excluded from Git, keeping your secrets secure.

---

### Generate requirements.txt

After installing all libraries, generate the requirements file:

```bash
pip freeze > requirements.txt
```

> **What does this do?** Captures the exact names and versions of every installed library into `requirements.txt`. Anyone cloning your project can run `pip install -r requirements.txt` to recreate the exact same environment.

---

## 8. Django Project Initialization

### Initialize Django Project

```bash
django-admin startproject core .
```

> **What does this do?** Creates the Django project configuration files inside a folder called `core/`. The dot `.` at the end is important — it tells Django to create the files in the current directory instead of creating an extra nested folder.

> **What if you forget the dot?** Django creates an extra folder, making your project structure messy and breaking import paths.

**Files created:**
| File | Purpose |
|---|---|
| `core/settings.py` | All project configuration — database, installed apps, static files, etc. |
| `core/urls.py` | Root URL routing maps URLs to views |
| `core/wsgi.py` | Entry point for WSGI-compatible web servers (production deployment) |
| `core/asgi.py` | Entry point for ASGI-compatible servers (async deployment) |
| `manage.py` | Command-line utility for running the server, migrations, shell, etc. |

### Create the Transcriber App

```bash
python manage.py startapp transcriber
```

> **What does this do?** Creates a Django "app" a self-contained module that handles a specific feature. All transcription logic (models, views, services, URLs, templates) lives inside this app.

> **Why separate app and project?** Django encourages separating concerns. The `core/` folder is project-level config. The `transcriber/` folder is feature-level logic. This separation makes the codebase modular and maintainable.

### Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

> **What is `makemigrations`?** It reads your `models.py` files and generates migration files Python scripts that describe database schema changes.

> **What is `migrate`?** It applies those migration scripts to the actual database, creating or modifying tables. For OfflineScribe, this creates the `TranscriptionJob` table in SQLite.

> **What if you skip migrations?** The database won't have the required tables and the application will crash with a `no such table` error when it tries to save a transcription job.

---

## 9. Environment Variables (.env)

### Step 1 Copy the example file

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

### Step 2 — Generate a SECRET_KEY

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

This will print a random secure key in your terminal, something like:
```
django-insecure-x7k2#p9q@m!3n$v8...
```

### Step 3 — Paste the key into .env

Open `.env` and replace `your-secret-key-here` with the generated key:

```
SECRET_KEY=django-insecure-x7k2#p9q@m!3n$v8...
DEBUG=True
```

> **Important:** Every developer who clones this project generates their own `SECRET_KEY`. It is not shared each local installation has its own unique key. This is the correct and standard approach for all Django projects.

> **Why must SECRET_KEY never be in Git?** Django uses it to sign session cookies and CSRF tokens. If someone gets your SECRET_KEY, they can forge authentication tokens and compromise your application. Always keep it in `.env` which is listed in `.gitignore`.

Make sure `.gitignore` contains:
```
.env
venv/
__pycache__/
*.pyc
media/
db.sqlite3
```

---

## 10. Settings.py Explained

Here is a breakdown of every important setting in `core/settings.py` and why it exists:

```python
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()
```
Loads environment variables from `.env` into the process so `os.getenv()` can access them.

---

```python
BASE_DIR = Path(__file__).resolve().parent.parent
```
Defines the root directory of the project. All other paths (media, static, templates) are built relative to this. Using `Path` instead of string concatenation makes paths OS-independent.

---

```python
SECRET_KEY = os.getenv('SECRET_KEY')
```
Loads the secret key from the `.env` file. Never hardcode this value directly.

---

```python
DEBUG = os.getenv('DEBUG', 'False') == 'True'
```
Controls Django's debug mode. When `True`, Django shows detailed error pages with stack traces. Set to `False` in production — Django never shows internal errors to users when DEBUG is off.

---

```python
INSTALLED_APPS = [
    ...
    'transcriber',
]
```
Registers the `transcriber` app with Django. Without this, Django does not know the app exists — migrations won't work, templates won't be found, and static files won't be collected.

---

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    ...
]
```
Middleware are functions that process every request and response. Whitenoise middleware intercepts requests for static files and serves them directly, bypassing Django's view layer.

---

```python
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```
Tells Whitenoise to compress static files (CSS, JS) and add content hashes to filenames for cache-busting. This ensures browsers always load the latest version of your files after updates.

---

```python
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```
`MEDIA_ROOT` is the filesystem path where uploaded files are saved. `MEDIA_URL` is the URL prefix used to access those files from the browser. When a user uploads a video, it is saved at `BASE_DIR/media/uploads/filename.mp4`.

---

```python
DATA_UPLOAD_MAX_MEMORY_SIZE = 524288000
FILE_UPLOAD_MAX_MEMORY_SIZE = 524288000
```
Sets the maximum file upload size to 500MB. Without this, Django uses a default limit that would reject large video files.

---

## 11. Running the Application

Start the development server:

```bash
python manage.py runserver
```

Open your browser and go to:
```
http://127.0.0.1:8000
```

The application will be running and ready to accept file uploads.

> **Note:** The first time you transcribe a file, faster-whisper will download the selected model. This is a one-time download per model. Subsequent transcriptions use the cached model and start immediately.

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| `python` not recognized | Python not in PATH | Reinstall Python with "Add to PATH" checked |
| `ffmpeg` not recognized | ffmpeg not in PATH | Re-add `C:\ffmpeg\bin` to system PATH and restart terminal |
| `No such table` error | Migrations not run | Run `python manage.py migrate` |
| Static files not loading | App not in INSTALLED_APPS | Add `transcriber` to INSTALLED_APPS in settings.py |
| Upload fails immediately | File format not supported | Use MP4, MP3, WAV, MKV, AVI, or M4A |
| Transcription stuck | Model downloading | Wait first run downloads the model (~75MB to ~1.5GB) |
| `SECRET_KEY` is None | .env not loaded | Make sure `.env` exists in root and `load_dotenv()` is called |