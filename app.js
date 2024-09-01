let audioContext;
let analyser;
let microphone;
let javascriptNode;

document.getElementById('startBtn').addEventListener('click', function() {
    // Demander l'accès au microphone
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;  // Taille de la FFT

                // Création des noeuds audio
                microphone = audioContext.createMediaStreamSource(stream);
                javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

                // Connexion des noeuds
                microphone.connect(analyser);
                analyser.connect(javascriptNode);
                javascriptNode.connect(audioContext.destination);

                // Processus d'analyse du signal
                javascriptNode.onaudioprocess = function() {
                    let bufferLength = analyser.fftSize;
                    let dataArray = new Uint8Array(bufferLength);
                    analyser.getByteTimeDomainData(dataArray);

                    let frequency = detectFrequency(dataArray, audioContext.sampleRate);
                    if (frequency) {
                        document.getElementById('freqValue').innerText = frequency.toFixed(2);
                    }
                };
            })
            .catch(function(err) {
                console.error('Erreur d\'accès au microphone: ', err);
            });
    } else {
        console.log('getUserMedia non supporté sur ce navigateur.');
    }
});

// Fonction pour détecter la fréquence dominante dans le signal audio
function detectFrequency(dataArray, sampleRate) {
    let bufferSize = dataArray.length;
    let maxIndex = 0;
    let maxAmplitude = 0;

    // Recherche du pic d'amplitude (fréquence dominante)
    for (let i = 0; i < bufferSize; i++) {
        if (dataArray[i] > maxAmplitude) {
            maxAmplitude = dataArray[i];
            maxIndex = i;
        }
    }

    // Conversion de l'index en fréquence (en Hz)
    let frequency = maxIndex * (sampleRate / 2) / bufferSize;
    return frequency;
}