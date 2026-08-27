import json
import threading
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import TranscriptionJob
from .services import process_job


def index(request):
    return render(request, 'transcriber/index.html', {})


@csrf_exempt
def upload_file(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required'}, status=405)

    file = request.FILES.get('file')
    if not file:
        return JsonResponse({'error': 'No file provided. Please select a file to upload.'}, status=400)

    # File size check 500MB limit
    max_size = 500 * 1024 * 1024
    if file.size > max_size:
        return JsonResponse({'error': 'File size exceeds 500MB limit. Please upload a smaller file.'}, status=400)

    allowed_extensions = ['.mp4', '.mp3', '.wav', '.mkv', '.avi', '.m4a']
    ext = '.' + file.name.split('.')[-1].lower()
    if ext not in allowed_extensions:
        return JsonResponse({'error': 'Unsupported format. Allowed formats: MP4, MP3, WAV, MKV, AVI, M4A'}, status=400)

    allowed_models = ['tiny', 'small', 'medium']
    model_name = request.POST.get('model_name', 'small')
    if model_name not in allowed_models:
        model_name = 'small'

    job = TranscriptionJob.objects.create(
        original_file=file,
        model_name=model_name,
        status='uploaded'
    )

    thread = threading.Thread(target=process_job, args=(job.id,))
    thread.daemon = True
    thread.start()

    return JsonResponse({
        'job_id': str(job.id),
        'status': job.status
    })


def job_status(request, job_id):
    try:
        job = TranscriptionJob.objects.get(id=job_id)

        response = {
            'job_id': str(job.id),
            'status': job.status,
        }

        if job.status == 'done':
            response['segments'] = json.loads(job.segments_json) if job.segments_json else []
            response['transcript'] = job.transcript or ''

        if job.status == 'failed':
            response['error_message'] = job.error_message or 'Processing failed.'

        return JsonResponse(response)

    except TranscriptionJob.DoesNotExist:
        return JsonResponse({'error': 'Job not found'}, status=404)