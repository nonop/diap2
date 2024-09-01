document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('tuner-canvas');
    const ctx = canvas.getContext('2d');
    const frequencyDisplay = document.getElementById('frequency-value');
    const toggleButton = document.getElementById('tuner-toggle');

    let audioContext;
    let analyser;
    let microphone;
    let isMicActive = false;

    // Fonction pour démarrer le microphone
    async function startMicrophone() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        microphone.connect(analyser);

        analyser.fftSize = 4096; // Augmenter la taille pour une meilleure résolution
        analyser.smoothingTimeConstant = 0.1; // Ajuster le lissage

        drawSpectrum();
    }

    // Fonction pour arrêter le microphone
    function stopMicrophone() {
        if (microphone) {
            microphone.disconnect();
            microphone = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        if (analyser) {
            analyser.disconnect();
            analyser = null;
        }
        isMicActive = false;
        frequencyDisplay.textContent = '0';
        toggleButton.classList.remove('active');
        toggleButton.querySelector('.switch-status').textContent = 'OFF';
    }

    // Fonction pour dessiner le graphique du spectre
    function drawSpectrum() {
        if (!analyser) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        analyser.getByteFrequencyData(dataArray);

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i];
            ctx.fillStyle = '#004d40';
            ctx.fillRect(x, height - barHeight / 2, barWidth, barHeight / 2);
            x += barWidth + 1;
        }

        requestAnimationFrame(drawSpectrum);

        const frequency = getFrequency();
        frequencyDisplay.textContent = frequency.toFixed(2);
    }

    // Fonction pour obtenir la fréquence
    function getFrequency() {
        if (!analyser) return 0;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        let max = 0;
        let index = 0;

        for (let i = 0; i < bufferLength; i++) {
            if (dataArray[i] > max) {
                max = dataArray[i];
                index = i;
            }
        }

        const nyquist = audioContext.sampleRate / 2;
        const frequency = index * nyquist / bufferLength;

        return frequency;
    }

    // Gestion des événements des boutons
    toggleButton.addEventListener('click', () => {
        if (isMicActive) {
            stopMicrophone();
        } else {
            startMicrophone();
            toggleButton.classList.add('active');
            toggleButton.querySelector('.switch-status').textContent = 'ON';
            isMicActive = true;
        }
    });
});
