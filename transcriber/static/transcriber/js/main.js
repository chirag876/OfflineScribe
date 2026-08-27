const fileInput = document.getElementById('file-input');
const uploadZone = document.getElementById('upload-zone');
const fileInfo = document.getElementById('file-info');
const fileNameText = document.getElementById('file-name-text');
const fileSizeText = document.getElementById('file-size-text');
const timeEstimate = document.getElementById('time-estimate');
const uploadBtn = document.getElementById('upload-btn');
const btnText = document.getElementById('btn-text');

const uploadCard = document.getElementById('upload-card');
const resultCard = document.getElementById('result-card');
const progressSection = document.getElementById('progress-section');
const statusMessage = document.getElementById('status-message');
const transcriptSection = document.getElementById('transcript-section');
const transcriptBox = document.getElementById('transcript-box');
const errorSection = document.getElementById('error-section');
const errorBox = document.getElementById('error-box');
const copyBtn = document.getElementById('copy-btn');
const downloadSrtBtn = document.getElementById('download-srt-btn');
const downloadTxtBtn = document.getElementById('download-txt-btn');

let pollingInterval = null;
let currentSegments = [];

// File size → time estimate
function getTimeEstimate(sizeMB) {
    if (sizeMB < 10) return '⏱ Est. time: <span>under 2 minutes</span>';
    if (sizeMB < 50) return '⏱ Est. time: <span>2 – 5 minutes</span> (10–50 MB range)';
    if (sizeMB < 150) return '⏱ Est. time: <span>5 – 15 minutes</span> (50–150 MB range)';
    if (sizeMB < 500) return '⏱ Est. time: <span>15 – 40 minutes</span> (150–500 MB range)';
    return '⏱ Est. time: <span>40+ minutes</span> — large file, be patient';
}

// Format seconds → HH:MM:SS,mmm
function formatTimestamp(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// Render segments in transcript box
function renderSegments(segments) {
    transcriptBox.innerHTML = '';
    segments.forEach(seg => {
        const div = document.createElement('div');
        div.className = 'segment';
        div.innerHTML = `
            <span class="segment-time">${formatTimestamp(seg.start)} → ${formatTimestamp(seg.end)}</span>
            <span class="segment-text">${seg.text.trim()}</span>
        `;
        transcriptBox.appendChild(div);
    });
}

// Update progress steps
function updateStep(status) {
    const steps = ['uploaded', 'extracting', 'transcribing', 'done'];
    const messages = {
        'uploaded': 'File uploaded, queued for processing...',
        'extracting': 'Extracting audio track from file...',
        'transcribing': 'Transcribing speech to text, this may take a few minutes...',
        'done': 'Transcription complete!',
        'failed': 'Processing failed.'
    };

    steps.forEach(s => {
        const el = document.getElementById(`step-${s}`);
        if (!el) return;
        el.classList.remove('active', 'completed', 'failed');
    });

    const currentIndex = steps.indexOf(status);
    steps.forEach((s, i) => {
        const el = document.getElementById(`step-${s}`);
        if (!el) return;
        if (i < currentIndex) el.classList.add('completed');
        else if (i === currentIndex) el.classList.add('active');
    });

    statusMessage.textContent = messages[status] || 'Processing...';
}

// File select
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);

        // 500MB frontend validation
        if (file.size > 500 * 1024 * 1024) {
            alert('File size exceeds 500MB limit. Please upload a smaller file.');
            fileInput.value = '';
            return;
        }

        fileNameText.textContent = file.name;
        fileSizeText.textContent = `${sizeMB} MB`;
        timeEstimate.innerHTML = getTimeEstimate(parseFloat(sizeMB));

        uploadZone.style.display = 'none';
        fileInfo.style.display = 'block';
        document.getElementById('model-selector').style.display = 'block';
        uploadBtn.disabled = false;
    }
});

// Drag and drop
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '#555';
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.style.borderColor = '#272727';
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '#272727';
    const file = e.dataTransfer.files[0];
    if (file) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event('change'));
    }
});

// Reset file
function resetFile() {
    fileInput.value = '';
    uploadZone.style.display = 'block';
    fileInfo.style.display = 'none';
    document.getElementById('model-selector').style.display = 'none';
    uploadBtn.disabled = true;
}

// Reset all
function resetAll() {
    resetFile();
    resultCard.style.display = 'none';
    uploadCard.style.display = 'block';
    transcriptSection.style.display = 'none';
    errorSection.style.display = 'none';
    currentSegments = [];
    if (pollingInterval) clearInterval(pollingInterval);
}

// Upload
uploadBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    uploadBtn.disabled = true;
    btnText.textContent = 'Uploading...';

    uploadCard.style.display = 'none';
    resultCard.style.display = 'block';
    progressSection.style.display = 'block';
    transcriptSection.style.display = 'none';
    errorSection.style.display = 'none';

    updateStep('uploaded');

    const formData = new FormData();
    formData.append('file', file);

    // Get selected transcription model
    const selectedModel =
        document.querySelector('input[name="model"]:checked')?.value || 'small';

    formData.append('model_name', selectedModel);

    try {
        const response = await fetch('/upload/', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.error || 'Upload failed. Please try again.');
            return;
        }

        startPolling(data.job_id);

    } catch (err) {
        showError('Could not connect to server. Please try again.');
    }
});

// Polling
// Typing animation state
let typingInterval = null;
const typingPhrases = [
    "Listening to audio...",
    "Processing speech patterns...",
    "Recognizing words...",
    "Building transcript...",
    "Analyzing audio segments...",
    "Converting speech to text...",
];
let typingIndex = 0;

function startTypingAnimation() {
    // Show transcript box with animated placeholder
    transcriptSection.style.display = 'block';
    document.querySelector('.transcript-actions').style.display = 'none';
    document.querySelector('.btn-new').style.display = 'none';

    transcriptBox.innerHTML = `<div class="typing-placeholder" id="typing-placeholder"></div>`;

    const placeholder = document.getElementById('typing-placeholder');
    let charIndex = 0;
    let currentPhrase = typingPhrases[typingIndex % typingPhrases.length];

    typingInterval = setInterval(() => {
        if (charIndex < currentPhrase.length) {
            placeholder.textContent += currentPhrase[charIndex];
            charIndex++;
        } else {
            // Phrase complete — pause then next phrase
            setTimeout(() => {
                placeholder.textContent = '';
                charIndex = 0;
                typingIndex++;
                currentPhrase = typingPhrases[typingIndex % typingPhrases.length];
            }, 1200);
        }
    }, 60);
}

function stopTypingAnimation() {
    if (typingInterval) {
        clearInterval(typingInterval);
        typingInterval = null;
    }
}

function startPolling(jobId) {
    pollingInterval = setInterval(async () => {
        try {
            const response = await fetch(`/status/${jobId}/`);
            const data = await response.json();

            updateStep(data.status);

            // Transcribing — typing animation dikhao
            if (data.status === 'transcribing') {
                if (!typingInterval) {
                    startTypingAnimation();
                }
            }

            if (data.status === 'done') {
                clearInterval(pollingInterval);
                stopTypingAnimation();
                currentSegments = data.segments || [];
                progressSection.style.display = 'none';
                transcriptSection.style.display = 'block';
                document.querySelector('.transcript-actions').style.display = 'flex';
                document.querySelector('.btn-new').style.display = 'block';
                renderSegments(currentSegments);
                transcriptBox.scrollTop = transcriptBox.scrollHeight;
                btnText.textContent = 'Transcribe';
                uploadBtn.disabled = false;
            }

            if (data.status === 'failed') {
                clearInterval(pollingInterval);
                stopTypingAnimation();
                showError(data.error_message || 'Processing failed. Please try again.');
            }

        } catch (err) {
            clearInterval(pollingInterval);
            stopTypingAnimation();
            showError('Connection lost. Please refresh and try again.');
        }
    }, 3000);
}
// Show error
function showError(message) {
    progressSection.style.display = 'none';
    errorSection.style.display = 'block';
    errorBox.textContent = message;
    btnText.textContent = 'Transcribe';
    uploadBtn.disabled = false;
}

// Copy
// Copy
copyBtn.addEventListener('click', () => {
    const text = currentSegments.map(s =>
        `[${formatTimestamp(s.start)} → ${formatTimestamp(s.end)}] ${s.text.trim()}`
    ).join('\n');
    navigator.clipboard.writeText(text).then(() => {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span style="color: #10b981;">Copied!</span>
        `;
        setTimeout(() => { copyBtn.innerHTML = originalHTML; }, 2000);
    });
});

// Download TXT
downloadTxtBtn.addEventListener('click', () => {
    const text = currentSegments.map(s =>
        `[${formatTimestamp(s.start)} → ${formatTimestamp(s.end)}] ${s.text.trim()}`
    ).join('\n');
    downloadFile('transcript.txt', text, 'text/plain');
});

// Download SRT
downloadSrtBtn.addEventListener('click', () => {
    const srt = currentSegments.map((s, i) =>
        `${i + 1}\n${formatTimestamp(s.start).replace(',', '.')} --> ${formatTimestamp(s.end).replace(',', '.')}\n${s.text.trim()}\n`
    ).join('\n');
    downloadFile('transcript.srt', srt, 'text/plain');
});

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}