import uuid
from django.db import models


class TranscriptionJob(models.Model):

    STATUS_CHOICES = [
        ('uploaded', 'Uploaded'),
        ('extracting', 'Extracting Audio'),
        ('transcribing', 'Transcribing'),
        ('done', 'Done'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_file = models.FileField(upload_to='uploads/')
    audio_file = models.FileField(upload_to='audio/', blank=True, null=True)
    transcript = models.TextField(blank=True, null=True)
    segments_json = models.TextField(blank=True, null=True)  # 👈 for storing segements
    error_message = models.TextField(blank=True, null=True)  # 👈 for storing error messages
    model_name = models.CharField(max_length=20, default='small')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Job {self.id} — {self.status}"