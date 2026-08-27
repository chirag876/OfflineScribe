<p align="center">
  <img src="transcriber/static/transcriber/favicon.svg" width="80" height="80" alt="OfflineScribe Logo"/>
</p>

<h1 align="center">OfflineScribe</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/Django-6.1-092E20?style=flat-square&logo=django&logoColor=white"/>
  <img src="https://img.shields.io/badge/faster--whisper-offline-FF6B35?style=flat-square"/>
  <img src="https://img.shields.io/badge/ffmpeg-audio%20engine-007808?style=flat-square&logo=ffmpeg&logoColor=white"/>
  <img src="https://img.shields.io/badge/SQLite-database-003B57?style=flat-square&logo=sqlite&logoColor=white"/>
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square"/>
</p>

<p align="center">
  A fully offline, privacy-first audio and video transcription tool.<br/>
  No cloud APIs. No internet dependency. No data leaves your machine.
</p>

---
## Screenshots


<p align="center">
  <img src="documentation/images/Image%201.png" alt="OfflineScribe : Upload Interface" width="900"/>
</p>

<p align="center">
  <strong>OfflineScribe : Upload Interface</strong><br/>
  <sub>Upload audio or video files for local transcription.</sub>
</p>

<details>
<summary><strong>Model Selection</strong></summary>

<br/>

<p align="center">
  <img src="documentation/images/Image%202.png" alt="OfflineScribe : Model Selection" width="900"/>
</p>

<p align="center">
  <sub>Choose between Tiny, Small, and Medium models based on speed and transcription quality.</sub>
</p>

</details>

<details>
<summary><strong>Transcription Progress</strong></summary>

<br/>

<p align="center">
  <img src="documentation/images/Image%203.png" alt="OfflineScribe : Transcription Progress" width="900"/>
</p>

<p align="center">
  <sub>Track the transcription pipeline while the audio is processed locally.</sub>
</p>

</details>

<details>
<summary><strong>Processing Status</strong></summary>

<br/>

<p align="center">
  <img src="documentation/images/Image%205.png" alt="OfflineScribe: Processing Status" width="900"/>
</p>

<p align="center">
  <sub>See the current processing stage from upload to transcription.</sub>
</p>

</details>

<details>
<summary><strong>Transcript & Export</strong></summary>

<br/>

<p align="center">
  <img src="documentation/images/Image%204.png" alt="OfflineScribe : Transcript and Export" width="900"/>
</p>

<p align="center">
  <sub>View timestamped transcripts and export them as SRT or TXT files.</sub>
</p>

</details>

---

## What is OfflineScribe?

OfflineScribe is a local web application that transcribes audio and video files directly on your machine using open-source speech recognition models. It strips audio from any video file using `ffmpeg`, processes it through `faster-whisper` (an optimized offline Whisper implementation), and returns a timestamped transcript all without sending a single byte to any external server.

Built for developers, content creators, researchers, and anyone who needs accurate transcription without sacrificing privacy or paying for API credits.

---

## Core Features

- **Fully Offline** : No internet required after initial model download. All processing happens locally.
- **Multi-format Support** : Accepts MP4, MP3, WAV, MKV, AVI, and M4A files.
- **Timestamped Transcripts** : Every segment includes precise start and end timestamps.
- **Model Selection** : Choose between Tiny, Small, and Medium Whisper models based on your speed vs. accuracy preference.
- **Multiple Export Formats** : Download transcripts as `.srt` (subtitle format) or `.txt`, or copy directly to clipboard.
- **Real-time Progress Tracking** : Step-by-step status updates: Uploaded → Extracting Audio → Transcribing → Done.
- **Typing Animation** : Visual feedback during transcription so you always know the process is running.
- **Smart Time Estimates** : File size-based processing time estimates shown before transcription begins.
- **Error Handling** : Clear, user-friendly error messages for every failure scenario without exposing internals.
- **File Size Validation** : Frontend and backend validation with a 500MB file size limit.

---

## How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│             │     │                  │     │                     │     │                  │     │                 │
│  User drops │────▶│  Django receives │────▶│  ffmpeg strips      │────▶│  faster-whisper  │────▶│  Timestamped    │
│  file on UI │     │  file + model    │     │  audio to 16kHz WAV │     │  transcribes     │     │  transcript     │
│             │     │  selection       │     │                     │     │  locally         │     │  shown on UI    │
└─────────────┘     └──────────────────┘     └─────────────────────┘     └──────────────────┘     └─────────────────┘
                                                                                                          │
                                                                              ┌───────────────────────────┤
                                                                              │                           │
                                                                       ┌──────▼──────┐           ┌───────▼──────┐
                                                                       │  Copy to    │           │  Download    │
                                                                       │  Clipboard  │           │  SRT / TXT   │
                                                                       └─────────────┘           └──────────────┘
```

**Pipeline detail:**

| Stage | What happens |
|---|---|
| **Upload** | File is validated (format + size) and saved locally |
| **Extracting** | `ffmpeg` strips audio track, converts to 16kHz mono WAV (optimal for Whisper) |
| **Transcribing** | `faster-whisper` runs selected model on WAV file, returns segments with timestamps |
| **Done** | Segments saved to DB, returned to frontend as JSON, rendered with timestamps |

---

## Tech Stack & Why Each Was Chosen

| Technology | Role | Why |
|---|---|---|
| **Python 3.13** | Core language | Latest stable, async-friendly, rich ML ecosystem |
| **Django 6.1** | Web framework | Built-in ORM, URL routing, file handling no boilerplate needed |
| **faster-whisper** | Speech-to-text engine | CTranslate2-optimized Whisper 4x faster than OpenAI's original with same accuracy, fully offline |
| **ffmpeg** | Audio extraction | Industry standard for audio/video processing, handles virtually every format |
| **SQLite** | Database | Zero-config local database, perfect for a single-user local tool |
| **Whitenoise** | Static file serving | Serves CSS/JS without needing a separate web server in development |
| **python-dotenv** | Environment config | Keeps `SECRET_KEY` and sensitive config out of source code |
| **Vanilla JS (Fetch API)** | Frontend | No framework overhead lightweight polling and DOM updates |
| **Threading** | Background processing | Runs transcription in a background thread without blocking the Django request cycle |

---

## Project Structure

```
OfflineScribe/
├── core/                   → Django project config (settings, urls, wsgi)
├── transcriber/            → Core app
│   ├── static/
│   │   └── transcriber/
│   │       ├── css/style.css
│   │       └── js/main.js
│   ├── templates/
│   │   └── transcriber/
│   │       └── index.html
│   ├── models.py           → TranscriptionJob model
│   ├── views.py            → Upload + status endpoints
│   ├── services.py         → ffmpeg + faster-whisper pipeline
│   └── urls.py             → App-level URL routing
├── media/                  → Uploaded files + extracted audio (auto-created)
├── .env                    → Environment variables (not committed)
├── manage.py
├── requirements.txt
├── README.md
└── SETUP.md
```

---

## Setup

### Quick Setup (Windows)
```bash
git clone https://github.com/yourusername/OfflineScribe.git
cd OfflineScribe
setup.bat
```

### Quick Setup (macOS / Linux)
```bash
git clone https://github.com/yourusername/OfflineScribe.git
cd OfflineScribe
chmod +x setup.sh && ./setup.sh
```

Then run:
```bash
# Windows
venv\Scripts\activate && python manage.py runserver

# macOS / Linux
source venv/bin/activate && python3 manage.py runserver
```

Open `http://127.0.0.1:8000` in your browser.

> For manual setup on, Django learning, or troubleshooting see [SETUP.md](documentation/SETUP.md)

---

## Developer

<table>
  <tr>
    <td><b>Chirag Gupta</b></td>
    <td>
      <a href="https://www.linkedin.com/in/chiraggupta1706/">LinkedIn</a> ·
      <a href="mailto:chirag1706gupta@gmail.com">chirag1706gupta@gmail.com</a>
    </td>
  </tr>
</table>

---