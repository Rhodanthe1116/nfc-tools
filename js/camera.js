const main = document.querySelector('main')
const playButton = document.querySelector('#play')
const video = document.querySelector('video');
const brightness = document.querySelector('#brightness')
const thresholdInput = document.querySelector('#threshold')
const thresholdValue = document.querySelector('#threshold-value')
thresholdInput.onchange = () => {
    thresholdValue.textContent = thresholdInput.value
}
//attach a click listener to a play button
playButton.onclick = async () => {
    try {
        const err = await Tone.start()
        
        if (err) {
            playButton.textContent = err
        } else {
            playButton.textContent = 'audio is ready'
            playButton.disabled = true   
        }
    } catch (err) {
        playButton.textContent = err
    }

}

function vibrate() {
    // vibrate for 200ms
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(200)
    }
}

function getImageBrightness(imageSrc, callback) {
    var img = document.createElement("img");
    img.src = imageSrc;
    img.style.display = "none";
    document.body.appendChild(img);

    var colorSum = 0;

    img.onload = function() {
        // create canvas
        var canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;

        var ctx = canvas.getContext("2d");
        ctx.drawImage(this, 0, 0);

        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        var r, g, b, avg;

        for (var x = 0, len = data.length; x < len; x += 4) {
            r = data[x];
            g = data[x + 1];
            b = data[x + 2];

            avg = Math.floor((r + g + b) / 3);
            colorSum += avg;
        }

        var brightness = Math.floor(colorSum / (this.width * this.height));
        callback(brightness);
    }
}

function getVideoBrightness() {
    var colorSum = 0;

    // create canvas
    var canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var r, g, b, avg;

    for (var x = 0, len = data.length; x < len; x += 4) {
        r = data[x];
        g = data[x + 1];
        b = data[x + 2];

        avg = Math.floor((r + g + b) / 3);
        colorSum += avg;
    }

    var brightness = Math.floor(colorSum / (canvas.width * canvas.height));
    return brightness;

}

// Prefer camera resolution nearest to 1280x720.
var constraints = {
    video: {
        width: 128,
        height: 128,
        facingMode: 'environment',
        frameRate: { ideal: 5, max: 5 }
    }
};

navigator.mediaDevices.getUserMedia(constraints)
    .then(function(mediaStream) {
        video.srcObject = mediaStream;
        video.onloadedmetadata = function(e) {
            video.play()
                .then(() => {
                    setInterval(() => {
                        brightnessValue = getVideoBrightness();
                        brightness.textContent = brightnessValue
                        if (brightnessValue < thresholdInput.value) {
                            state.textContent = 'YOYO CARd'
                            main.classList.add('detected')
                            vibrate()
                            const synth = new Tone.Synth().toDestination();
                            const now = Tone.now()
                            synth.triggerAttackRelease("C4", "8n", now)
                            synth.triggerAttackRelease("E4", "8n", now + 0.2)
                            synth.triggerAttackRelease("G4", "8n", now + 0.4)
                        } else {
                            state.textContent = '請將卡片遮住鏡頭'
                            main.classList.remove('detected')
                        }
                    }, 1000)
                }).catch(err => {
                    state.textContent = err
                })
        };
    })
    .catch(function(err) {
        state.textContent = (err.name + ": " + err.message);
    }); // always check for errors at the end.
