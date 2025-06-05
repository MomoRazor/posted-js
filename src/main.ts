import { Server } from 'socket.io'
import {
    EndpointInformationList,
    Listener,
    ListenerList,
    Optimization,
    ReadFactory,
    ReadList,
    RequestData,
    UpdateCall,
    WriteList
} from './types'
import http from 'http'
import { v4 } from 'uuid'
import { DateTime } from 'luxon'
import { guard } from '@ucast/mongo2js'

//TODO maybe some debouncing for updates can be implemented in case of multiple updates in a short time span
export class Posted<
    Entity extends string | number | symbol,
    ReadFunc extends string | number | symbol,
    WriteFunc extends string | number | symbol,
    Endpoint extends string | number | symbol
> {
    private _writeList: WriteList<Entity, WriteFunc> = []
    private _readList: ReadList<Entity, ReadFunc> = []

    private _endpointInfoList: EndpointInformationList<Endpoint, ReadFunc, WriteFunc> = []
    private _readFactory: ReadFactory<ReadFunc>

    private _listenerList: ListenerList<Entity, ReadFunc> = []
    private _socket: Server | null = null

    constructor(args: {
        httpServer: http.Server
        config: {
            writeList: WriteList<Entity, WriteFunc>
            readList: ReadList<Entity, ReadFunc>
            endpointInfoList: EndpointInformationList<Endpoint, ReadFunc, WriteFunc>
            readFactory: ReadFactory<ReadFunc>
            development?: boolean
        }
    }) {
        this._writeList = args.config.writeList
        this._readList = args.config.readList
        this._endpointInfoList = args.config.endpointInfoList
        this._readFactory = args.config.readFactory

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

        console.log('listener list', this._listenerList)

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
                dependants: call.dependants,
                name: functionName as WriteFunc
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

    addListenerOptimization(args: {
        listenerId: string
        dependencyOptimization: Optimization<Entity>
    }) {
        const { listenerId, dependencyOptimization } = args
        const listener = this._listenerList.find((item) => item.id === listenerId)

        if (!listener) {
            console.error('Listener not found for id:', listenerId)
            return
        }

        listener.dependencyOptimization = dependencyOptimization
        listener.lastUsed = DateTime.now()
    }

    async triggerUpdates(args: { call: UpdateCall<Entity, WriteFunc> }) {
        const { call } = args

        if (!this._socket) {
            console.error('Socket.io server is not initialized')
            return
        }

        if (!call.dependants || call.dependants.length == 0) {
            return
        }

        await Promise.all(
            this._listenerList.map(async (listener) => {
                if (!listener.dependencies || listener.dependencies.length == 0) {
                    return
                }

                const intersection = listener.dependencies.filter((dep) =>
                    call.dependants!.includes(dep)
                )

                if (intersection.length === 0) {
                    return
                }

                const runChange = async () => {
                    const data = this._readFactory[listener.name](listener.requestData)

                    try {
                        await this._socket!.timeout(2000).emitWithAck(listener.id, {
                            data
                        })

                        listener.lastUsed = DateTime.now()
                    } catch (e) {
                        console.error('Error emitting data for listener:', listener.id, e)
                        //remove listener if it fails to emit
                        this._listenerList = this._listenerList.filter(
                            (item) => item.id !== listener.id
                        )
                    }
                }

                if (!listener.dependencyOptimization) {
                    console.warn(
                        'Listeners for the following function do not have dependency optimization:',
                        listener.name
                    )

                    await runChange()
                } else {
                    if (!call.dependantOptimization) {
                        console.warn(
                            'No dependant optimization provided for update function:',
                            call.name
                        )

                        await runChange()
                    } else {
                        let complexIntersection = false
                        for (let j = 0; j < intersection.length; j++) {
                            if (!listener.dependencyOptimization[intersection[j]]) {
                                console.warn(
                                    'No dependency optimization found for intersection:',
                                    intersection[j],
                                    'in listener:',
                                    listener.name
                                )
                                continue
                            }

                            if (!call.dependantOptimization[intersection[j]]) {
                                console.warn(
                                    'No dependant optimization found for intersection:',
                                    intersection[j],
                                    'in call:',
                                    call.name
                                )
                                continue
                            }
                            const query = guard(listener.dependencyOptimization[intersection[j]]!)

                            if (query(call.dependantOptimization[intersection[j]]!)) {
                                complexIntersection = true
                                break
                            }
                        }

                        if (complexIntersection) {
                            await runChange()
                        } else {
                            console.info(
                                'No changes detected for listener:',
                                listener.name,
                                'with dependencies:',
                                intersection
                            )
                        }
                    }
                }
            })
        )
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
