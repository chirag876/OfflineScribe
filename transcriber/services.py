import subprocess
import os
import json
from pathlib import Path
from django.conf import settings


def extract_audio(input_path: str, output_path: str) -> bool:
    try:
        command = [
            'ffmpeg',
            '-i', input_path,
            '-vn',
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',
            '-y',
            output_path
        ]
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        return result.returncode == 0
    except Exception:
        return False


def transcribe_audio(audio_path: str, model_name: str = 'small'):
    try:
        from faster_whisper import WhisperModel

        model = WhisperModel(
            model_name,  # 👈 dynamic model
            device="cpu",
            compute_type="int8"
        )

        segments, _ = model.transcribe(audio_path, beam_size=5)

        result = []
        for segment in segments:
            result.append({
                'start': round(segment.start, 3),
                'end': round(segment.end, 3),
                'text': segment.text.strip()
            })

        return result
    except Exception:
        return None


def process_job(job_id):
    from .models import TranscriptionJob

    try:
        job = TranscriptionJob.objects.get(id=job_id)

        job.status = 'extracting'
        job.save()

        input_path = os.path.join(settings.MEDIA_ROOT, job.original_file.name)
        audio_filename = f"audio/{job.id}.wav"
        audio_path = os.path.join(settings.MEDIA_ROOT, audio_filename)

        Path(os.path.join(settings.MEDIA_ROOT, 'audio')).mkdir(
            parents=True, exist_ok=True)

        # Check if file exists
        if not os.path.exists(input_path):
            job.status = 'failed'
            job.error_message = 'Uploaded file could not be found. Please try uploading again.'
            job.save()
            return

        success = extract_audio(input_path, audio_path)

        if not success:
            job.status = 'failed'
            job.error_message = 'Could not extract audio from this file. Please make sure the file is a valid video or audio file.'
            job.save()
            return

        # Check if extracted audio has content
        if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
            job.status = 'failed'
            job.error_message = 'The file appears to have no audio track. Please upload a file with audio content.'
            job.save()
            return

        job.audio_file = audio_filename
        job.status = 'transcribing'
        job.save()

        segments = transcribe_audio(audio_path, job.model_name)

        if segments is None:
            job.status = 'failed'
            job.error_message = 'Transcription could not be completed. Please try again or use a different model.'
            job.save()
            return

        if len(segments) == 0:
            job.status = 'failed'
            job.error_message = 'No speech detected in the audio. Please check that the file contains spoken content.'
            job.save()
            return

        job.transcript = ' '.join([s['text'] for s in segments])
        job.segments_json = json.dumps(segments)
        job.status = 'done'
        job.save()

    except Exception:
        try:
            job.status = 'failed'
            job.error_message = 'Something went wrong while processing your file. Please try again.'
            job.save()
        except Exception:
            pass
