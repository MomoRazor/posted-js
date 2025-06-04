import { Server } from 'socket.io'
import {
    EndpointInformationList,
    Listener,
    ListenerList,
    ReadList,
    RequestData,
    UpdateCall,
    WriteList
} from './types'
import http from 'http'
import { v4 } from 'uuid'
import { DateTime } from 'luxon'

export class Posted<
    Entity extends string | number | symbol,
    ReadFunc extends string | number | symbol,
    WriteFunc extends string | number | symbol,
    Endpoint extends string | number | symbol
> {
    private _writeList: WriteList<Entity, WriteFunc> = []
    private _readList: ReadList<Entity, ReadFunc> = []

    private _endpointInfoList: EndpointInformationList<Endpoint, ReadFunc, WriteFunc> = []

    private _listenerList: ListenerList<Entity, ReadFunc> = []
    private _socket: Server | null = null

    constructor(args: {
        httpServer: http.Server
        config: {
            writeList: WriteList<Entity, WriteFunc>
            readList: ReadList<Entity, ReadFunc>
            endpointInfoList: EndpointInformationList<Endpoint, ReadFunc, WriteFunc>
            development?: boolean
        }
    }) {
        this._writeList = args.config.writeList
        this._readList = args.config.readList
        this._endpointInfoList = args.config.endpointInfoList

        this._socket = new Server(args.httpServer, {
            cors: {
                origin: '*',
                methods: ['GET'],
                allowedHeaders: ['Content-Type'],
                credentials: !args.config.development
            },
            transports: ['websocket']
        })
    }

    upsertListener(args: {
        id?: string
        name: ReadFunc
        requestData: RequestData | undefined
        dependencies?: Entity[]
    }): Listener<Entity, ReadFunc> {
        const { id, name, requestData, dependencies } = args
        if (!name) {
            throw new Error('Name is required for listener')
        }

        let listener: Listener<Entity, ReadFunc> | undefined
        if (id) {
            listener = this._listenerList.find((item) => item.id === id)

            if (listener) {
                listener.name = name
                listener.requestData = requestData
                listener.dependencies = dependencies
                listener.lastUsed = DateTime.now()

                return listener
            } else {
                console.info('Listener with id:', id, 'not found, creating new one')
            }
        }

        listener = { id: v4(), name, requestData, lastUsed: DateTime.now(), dependencies }
        this._listenerList.push(listener)

        return listener
    }

    detectCall(args: { name: WriteFunc | ReadFunc }) {
        const { name } = args
        const writeItem = this._writeList.find((item) => item.name === name)
        if (writeItem) {
            return {
                type: 'write',
                dependants: writeItem.dependants
            }
        }

        const readItem = this._readList.find((item) => item.name === name)
        if (readItem) {
            return {
                type: 'read',
                dependencies: readItem.dependencies
            }
        }

        console.info('No Call found for name:', name)
        return
    }

    handleUrl(args: {
        id: string | undefined
        url: string
        method: 'GET' | 'POST' | 'PUT' | 'DELETE'
        requestData: RequestData | undefined
    }) {
        const { id, url, method, requestData } = args

        let newUrl: URL
        try {
            newUrl = new URL(url, 'http://fake')
        } catch (error) {
            console.error('Invalid URL:', url)
            return
        }

        let functionName: ReadFunc | WriteFunc | undefined
        const endpointInfo = this._endpointInfoList.find(
            (item) => item.endpoint === newUrl.pathname && item.method === method
        )

        if (endpointInfo) {
            functionName = endpointInfo.function
        } else {
            const endpoints = this._endpointInfoList.map((endpointInfo) =>
                endpointInfo.endpoint.toString()
            )
            const splitUrl = url.toString().split('/')

            for (let i = 0; i < endpoints.length; i++) {
                const splitTestUrl = endpoints[i].split('/')
                if (splitUrl.length !== splitTestUrl.length) {
                    continue
                }

                let failed = false
                for (let j = 0; j < splitTestUrl.length; j++) {
                    if (splitTestUrl[j] !== splitUrl[j] && !splitTestUrl[j].startsWith(':')) {
                        failed = true
                        break
                    }
                }
                if (!failed) {
                    functionName = this._endpointInfoList[i].function
                    break
                }
            }
        }

        if (!functionName) {
            console.info('No function found for URL:', url, 'and method:', method)
            return
        }

        const call = this.detectCall({ name: functionName })

        if (!call) {
            console.info('No call found for function:', functionName)
            return
        }

        // If the call is a write operation, we don't need to return a listener
        if (call?.type === 'write') {
            this.deleteExpiredListeners()
            const updateCall: UpdateCall<Entity, WriteFunc> = {
                dependants: call.dependants
            }
            return {
                updateCall
            }
        } else {
            const listener = this.upsertListener({
                id,
                name: functionName as ReadFunc,
                requestData,
                dependencies: call.dependencies
            })
            this.deleteExpiredListeners()
            return {
                listener
            }
        }
    }

    // listened idle for over 5 minutes will be deleted
    deleteExpiredListeners() {
        const now = DateTime.now()
        this._listenerList = this._listenerList.filter((listener) => {
            const diff = now.diff(listener.lastUsed, 'minutes').minutes
            if (diff > 5) {
                console.info('Deleting expired listener:', listener.id)
                return false
            }
            return true
        })
    }
}
