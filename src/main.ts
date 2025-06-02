import { Server } from 'socket.io'
import { ReadFactory, ReadList, WriteList } from './types'
import http from 'http'

export class Posted<
    Entity extends string | number | symbol,
    ReadFunc extends string | number | symbol,
    WriteFunc extends string | number | symbol
> {
    private _writeList: WriteList<Entity, WriteFunc> = []
    private _readList: ReadList<Entity, ReadFunc> = []
    private _socket: Server | null = null
    // private _writeFactory: WriteFactory<WriteFunc> | undefined
    // private _readFactory: ReadFactory<ReadFunc> | undefined

    constructor(args: {
        writeList: WriteList<Entity, WriteFunc>
        readList: ReadList<Entity, ReadFunc>
        httpServer: http.Server
        development?: boolean
    }) {
        this._writeList = args.writeList
        this._readList = args.readList
        this._socket = new Server(args.httpServer, {
            cors: {
                origin: '*',
                methods: ['GET'],
                allowedHeaders: ['Content-Type'],
                credentials: !args.development
            },
            transports: ['websocket']
        })
    }

    handleReadCall(args: { read: ReadFunc }) {
        const { read } = args
        const readItem = this._readList.find((item) => item.name === read)
        if (!readItem) {
            throw new Error(`Read operation "${read.toString()}" not found`)
        }
    }
}
