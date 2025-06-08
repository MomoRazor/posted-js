import { PostedClient } from '@postedjs/client'

let app

function connect() {
    if (!app) {
        console.error('App is not initialized')
        return
    }
    app.connect()
}

function disconnect() {
    if (!app || !app._socket) {
        console.error('App or socket is not initialized')
        return
    }
    app._socket.disconnect()
}

document.addEventListener('load', () => {
    console.log('Document loaded, initializing PostedClient...')
    app = new PostedClient({
        baseUrl: 'http://localhost:3000',
        onConnect: () => {
            console.log('Connected to PostedJS server')
        },
        onDisconnect: () => {
            console.log('Disconnected from PostedJS server')
        },
        interceptor: async (cb) => {
            // Example interceptor that logs the data
            const data = cb({ message: 'Hello from interceptor!' })
            console.log('Interceptor data:', data)
        },
        development: true
    })
    window.connect = connect
    window.disconnect = disconnect
})
