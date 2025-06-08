import { io, Socket } from 'socket.io-client'
import { CallList } from './types'

export class PostedClient<ReadFunc extends string | number | symbol> {
    private _socket: Socket | null = null
    private _calls: CallList<ReadFunc> = []

    constructor(args: {
        baseUrl: string
        onConnect?: () => void
        onDisconnect?: () => void
        interceptor?: (cb: (data: object) => void) => Promise<void>
        development?: boolean
    }) {
        const { baseUrl, development, interceptor, onConnect, onDisconnect } = args

        this._socket = io(baseUrl, {
            autoConnect: false,
            withCredentials: !development,
            transports: ['websocket'],
            auth: interceptor
        })

        this._socket.on('connect', async () => {
            console.info('Connected!')
            onConnect && onConnect()

            for (let i = 0; i < this._calls.length; i++) {
                const id = await this._calls[i].originalPull()
                this._calls[i].id = id
            }
        })

        this._socket.on('disconnect', () => {
            console.info('Disconnected!')
            onDisconnect && onDisconnect()
        })
    }

    connect() {
        if (!this._socket) {
            throw new Error('Socket is not initialized')
        }
        if (this._socket.connected) {
            console.warn('Socket is already connected')
            return
        }
        this._socket.connect()
    }
}
