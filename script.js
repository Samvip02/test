// Selecting necessary elements
const recordBtn = document.getElementById('record-btn');
const pauseBtn = document.getElementById('pause-btn');
const saveBtn = document.getElementById('save-btn');
const uploadBtn = document.getElementById('upload-btn');
const recordsList = document.getElementById('records-list');

let isRecording = false;
let isPaused = false;
let mediaRecorder;
let audioChunks = [];
let records = [];

// Recording functionality
recordBtn.addEventListener('click', () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});

pauseBtn.addEventListener('click', () => {
    if (isPaused) {
        mediaRecorder.resume();
        pauseBtn.textContent = '⏸ Pause';
    } else {
        mediaRecorder.pause();
        pauseBtn.textContent = '▶️ Resume';
    }
    isPaused = !isPaused;
});

saveBtn.addEventListener('click', () => {
    saveRecording();
    recordBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
    saveBtn.style.display = 'none';
});

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            console.log("Recording started"); // Debug log
            recordBtn.textContent = '🛑 Stop';
            pauseBtn.style.display = 'inline-block';
            saveBtn.style.display = 'inline-block';

            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                console.log("Recording stopped"); // Debug log
                recordBtn.textContent = '🎤 Start Recording';
                pauseBtn.style.display = 'none';
                saveBtn.style.display = 'none';
                saveRecording();
            });
        })
        .catch(error => {
            console.error('Error accessing audio devices:', error);
            alert('Error accessing audio devices. Please check your permissions and try again.');
        });
    isRecording = true;
}

function stopRecording() {
    mediaRecorder.stop();
    isRecording = false;
    recordBtn.textContent = '🎤 Start Recording';
    pauseBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
}

function saveRecording() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    audioChunks = [];
    addRecordingToList(audioBlob);
}

function addRecordingToList(audioBlob) {
    const url = URL.createObjectURL(audioBlob);
    const li = document.createElement('li');
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = url;
    li.appendChild(audio);

    const actions = document.createElement('div');
    actions.innerHTML = `
        <button onclick="renameRecord(this)">Rename</button>
        <button onclick="deleteRecord(this)">Delete</button>
        <button onclick="downloadRecord('${url}')">Download</button>
        <button onclick="sendToWhisperAI('${url}')">Send to Whisper AI</button>
    `;
    li.appendChild(actions);

    recordsList.appendChild(li);
    records.push({ url, blob: audioBlob });
}

uploadBtn.addEventListener('change', () => {
    const files = uploadBtn.files;
    Array.from(files).forEach(file => {
        const url = URL.createObjectURL(file);
        addRecordingToList(file);
    });
});

function renameRecord(button) {
    const li = button.parentElement.parentElement;
    const newName = prompt('Enter new name for the record:');
    if (newName) {
        li.querySelector('audio').setAttribute('name', newName);
    }
}

function deleteRecord(button) {
    const li = button.parentElement.parentElement;
    recordsList.removeChild(li);
}

function downloadRecord(url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recording.wav';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function sendToWhisperAI(url) {
    alert(`Sending ${url} to Whisper AI (feature under development).`);
}
// JavaScript Frontend Code
function sendToWhisperAI(url) {
    alert('Preparing to send audio to server for Whisper AI transcription...');

    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const formData = new FormData();
            formData.append('audio', blob, 'recording.wav');

            // Send audio to your backend server
            fetch('https://webadmin05.000webhostapp.com/back.py', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Server error:', data.error);
                    alert('Server error: ' + data.error);
                } else {
                    displayTranscription(data.transcription, data.time_format);
                }
            })
            .catch(error => {
                console.error('Error during transcription:', error);
                alert('There was an error transcribing the audio. Please try again later.');
            });
        })
        .catch(error => {
            console.error('Error fetching audio:', error);
            alert('There was an error preparing the audio. Please try again.');
        });
}

function displayTranscription(transcription, timeFormat) {
    alert(`Transcription: ${transcription}\nExtracted Time Format: ${timeFormat}`);
}
