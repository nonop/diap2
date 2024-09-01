let audioContext;
let analyser;
let microphone;
let bufferLength;
let dataArray;
let isActive = false;

document.getElementById('toggleButton').addEventListener('click', function() {
    if (isActive) {
        stopAudio();
        this.classList.remove('active');
        this.textContent = 'Activer';
    } else {
        startAudio();
        this.classList.add('active');
        this.textContent = 'Désactiver';
    }
    isActive = !isActive;
});

function startAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);
                console.log("Microphone connecté.");
                requestAnimationFrame(updateFrequency);
                requestAnimationFrame(drawSpectrogram);
            })
            .catch(function(err) {
                console.error('Erreur de capture audio:', err);
            });
    }
}

function stopAudio() {
    if (audioContext) {
        microphone.disconnect();
        analyser.disconnect();
        audioContext.close();
        audioContext = null;
        console.log("Audio arrêté.");
    }
}

function getFrequencyData() {
    analyser.getByteFrequencyData(dataArray);
    return dataArray;
}

function getDominantFrequency() {
    const data = getFrequencyData();
    let maxIndex = 0;
    let maxValue = 0;

    for (let i = 0; i < data.length; i++) {
        if (data[i] > maxValue) {
            maxValue = data[i];
            maxIndex = i;
        }
    }

    let nyquist = audioContext.sampleRate / 2;
    let frequency = maxIndex * nyquist / data.length;
    
    return frequency;
}

let frequencyHistory = [];
const SMOOTHING_FACTOR = 5;

function smoothFrequency(frequency) {
    frequencyHistory.push(frequency);
    if (frequencyHistory.length > SMOOTHING_FACTOR) {
        frequencyHistory.shift();
    }
    const sum = frequencyHistory.reduce((a, b) => a + b, 0);
    return sum / frequencyHistory.length;
}

function updateFrequency() {
    if (!analyser) return;

    let frequency = getDominantFrequency();
    if (frequency > 0) {
        let smoothedFrequency = smoothFrequency(frequency);
        document.getElementById('freqValue').innerText = smoothedFrequency.toFixed(2);
    } else {
        document.getElementById('freqValue').innerText = "--";
    }

    requestAnimationFrame(updateFrequency);
}

let canvas = document.getElementById('spectrogram');
let canvasContext = canvas.getContext('2d');

function drawSpectrogram() {
    if (!analyser || !canvasContext) return;

    analyser.getByteFrequencyData(dataArray);

    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    let barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        canvasContext.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
        canvasContext.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);
        x += barWidth + 1;
    }

    requestAnimationFrame(drawSpectrogram);
}

if (!canvas || !canvasContext) {
    console.error('Erreur: Canvas non trouvé ou contexte non disponible.');
}
