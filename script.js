log = console.log


const heading = document.querySelector('#heading')

const notSupported = document.querySelector('#not-supported')
const supported = document.querySelector('#supported')

const state = document.querySelector('#state')
const scanButton = document.querySelector('#scan-button')
const writeButton = document.querySelector('#write-button')
const formSerialNumber = document.querySelector('#serial-number')
const record = document.querySelector('#record')
const nfcAvailable = document.querySelector('#nfc-available')
const errorMessage = document.querySelector('#error-message')
const toggleSoundButton = document.querySelector('#toggle-sound-button')

const nfcMessage = document.querySelector('#nfc-message')
const nfcSerialNumber = document.querySelector('#nfc-serial-number')

let isSoundOn = false



fetch('/api/rents')
    .then(response => {
        return response.json()
    })
    .then(rents => {
        rents.forEach(({ serialNumber, timestamp }) => {
            timestamp = new Date(timestamp)
            const li = document.createElement('li')
            li.textContent = `${serialNumber} ${timestamp.toLocaleString()}`
            record.insertBefore(li, record.firstElementChild);
        })
    })

//attach a click listener to a play button
toggleSoundButton.onclick = async () => {
    await Tone.start()
    isSoundOn = !isSoundOn
    if (isSoundOn) {
        toggleSoundButton.lastElementChild.classList.remove('bi-volume-mute')
        toggleSoundButton.lastElementChild.classList.add('bi-volume-up')
    } else {
        toggleSoundButton.lastElementChild.classList.remove('bi-volume-up')
        toggleSoundButton.lastElementChild.classList.add('bi-volume-mute')
    }
    console.log('audio is ready')
}

function makeSound() {
    const synth = new Tone.Synth().toDestination();
    const now = Tone.now()
    synth.triggerAttackRelease("C4", "8n", now)
    synth.triggerAttackRelease("E4", "8n", now + 0.2)
    synth.triggerAttackRelease("G4", "8n", now + 0.4)
}

async function main() {
    if (!("NDEFReader" in window)) {
        supported.remove()
        log(
            "Web NFC is not available.\n" +
            'Please make sure the "Experimental Web Platform features" flag is enabled on Android.'
        );
        return 0

    } else {
        notSupported.remove()
    }

    try {
        const ndef = new NDEFReader();
        await ndef.scan();
        // state.textContent = "Scanning..."

        ndef.onerror = (event) => {
            errorMessage.textContent = `Argh! ${event.message}`
        };

        ndef.onreadingerror = () => {
            console.log("Cannot read data from the NFC tag. Try another one?");
            errorMessage.textContent = ("Cannot read data from the NFC tag. Try another one?");
        };

        ndef.onreading = (event) => {

            if (isSoundOn) {
                makeSound()
            }

            const { message, serialNumber } = event

            nfcSerialNumber.textContent = `Serial Number: ${serialNumber}`

            nfcMessage.innerHTML = ''
            for (const record of message.records) {
                nfcMessage.innerHTML += `
                    <div>
                        <p>Record type:  ${record.recordType}</p>
                        <p>MIME type:    ${record.mediaType}</p>
                        <p>Record id:    ${record.id}</p>
                    </div>
                `
                switch (record.recordType) {
                    case "text":
                        // TODO: Read text record with record data, lang, and encoding.
                        break;
                    case "url":
                        // TODO: Read URL record with record data.
                        break;
                    default:
                    // TODO: Handle other records with record data.
                }
            }

            fetch('/api/rents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    serialNumber: serialNumber,
                    'hi': 1
                })
            }).then(response => {
                return response.json()
            }).then(({ timestamp }) => {
                timestamp = new Date(timestamp)
                const li = document.createElement('li')
                li.textContent = `${serialNumber} ${timestamp.toLocaleString()}`

                record.insertBefore(li, record.firstElementChild);
            })

        };

    } catch (error) {
        errorMessage.textContent = "Argh! " + error
        log("Argh! " + error);
    }
}
main()

writeButton.addEventListener("click", async () => {
    log("User clicked write button");

    try {
        const ndef = new NDEFReader();
        await ndef.write("Hello world!");
        log("> Message written");
    } catch (error) {
        errorMessage.textContent = "Argh! " + error
        log("Argh! " + error);
    }
});