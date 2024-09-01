document.addEventListener('DOMContentLoaded', () => {
    const frequencyDisplay = document.getElementById('frequency-display');
    const startButton = document.getElementById('start-button');

    let audioContext;
    let analyser;
    let microphone;

    startButton.addEventListener('click', async () => {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphone = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            microphone.connect(analyser);

            analyser.fftSize = 8192; // Taille de la FFT augmentée pour plus de précision
            analyser.smoothingTimeConstant = 0.3; // Temps de lissage

            measureFrequency();
        } catch (err) {
            console.error('Erreur du microphone:', err);
            alert("Impossible d'accéder au microphone. Veuillez autoriser l'accès.");
        }
    });

    function measureFrequency() {
        if (!analyser) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        analyser.getByteFrequencyData(dataArray);

        const frequency = getFundamentalFrequency(dataArray, audioContext.sampleRate, analyser.fftSize);
        frequencyDisplay.textContent = `Fréquence : ${frequency.toFixed(2)} Hz`;

        requestAnimationFrame(measureFrequency);
    }

    function getFundamentalFrequency(dataArray, sampleRate, fftSize) {
        const nyquist = sampleRate / 2;
        const binSize = nyquist / (fftSize / 2);
        const spectrum = new Float32Array(dataArray.length);

        for (let i = 0; i < dataArray.length; i++) {
            spectrum[i] = dataArray[i] / 255;
        }

        const peakIndex = findPeak(spectrum);
        const preciseFrequency = interpolateFrequency(spectrum, peakIndex, binSize);

        return preciseFrequency;
    }

    function findPeak(spectrum) {
        let maxIndex = 0;
        let maxValue = 0;

        for (let i = 1; i < spectrum.length - 1; i++) {
            if (spectrum[i] > spectrum[i - 1] && spectrum[i] > spectrum[i + 1]) {
                if (spectrum[i] > maxValue) {
                    maxValue = spectrum[i];
                    maxIndex = i;
                }
            }
        }

        return maxIndex;
    }

    function interpolateFrequency(spectrum, peakIndex, binSize) {
        if (peakIndex <= 0 || peakIndex >= spectrum.length - 1) {
            return peakIndex * binSize;
        }

        const x0 = spectrum[peakIndex - 1];
        const x1 = spectrum[peakIndex];
        const x2 = spectrum[peakIndex + 1];

        const a = (x0 - 2 * x1 + x2) / 2;
        const b = (x2 - x0) / 2;
        const peak = peakIndex + b / (2 * a);

        return peak * binSize;
    }

    window.addEventListener('beforeunload', () => {
        if (microphone) {
            microphone.disconnect();
        }
        if (audioContext) {
            audioContext.close();
        }
    });
});
