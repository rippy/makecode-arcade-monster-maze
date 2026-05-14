import { on } from '@rcade/plugin-input-classic'

// MakeCode sim button indices (from sim.js postMessage handler at line ~393)
const SIM_BUTTON = { A: 0, B: 1, UP: 2, DOWN: 3, LEFT: 4, RIGHT: 5 }

const sim = document.getElementById('sim')

function sendToSim(msg) {
    sim.contentWindow?.postMessage(msg, '*')
}

function startSim(code) {
    sendToSim({
        type: 'run',
        parts: [],
        code,
        partDefinitions: [],
        storedState: {},
        frameCounter: 1,
        options: { theme: 'green', player: '' },
        id: `green-${Math.random()}`,
    })
}

// Step 1: load the binary, then point the iframe at the sim
fetch('binary.js')
    .then(res => res.text())
    .then(code => {
        // Step 2: listen for "ready" before sending "run"
        window.addEventListener('message', function handler(ev) {
            if (ev.data?.type === 'ready') {
                window.removeEventListener('message', handler)
                startSim(code)
            }
            // Relay restart requests from the sim
            if (ev.data?.type === 'simulator' && ev.data?.command === 'restart') {
                sendToSim({ type: 'stop' })
                setTimeout(() => startSim(code), 500)
            }
        })

        // Step 3: trigger the iframe load (fires "ready" once the sim initializes)
        sim.src = '/---simulator.html?hideSimButtons=1&noExtraPadding=1&fullscreen=1&autofocus=1&nofooter=1'
    })
    .catch(err => console.error('Failed to load binary.js:', err))

// Bridge RCade inputs → sim button postMessages
on('inputStart', ({ type, button }) => {
    if (type === 'button' && button in SIM_BUTTON) {
        sendToSim({ button: SIM_BUTTON[button], pressed: true })
    }
})

on('inputEnd', ({ type, button }) => {
    if (type === 'button' && button in SIM_BUTTON) {
        sendToSim({ button: SIM_BUTTON[button], pressed: false })
    }
})
