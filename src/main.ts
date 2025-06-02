import { EndpointInformationList, ReadList, WriteList } from './types'
import http from 'http'

export class Posted<
    Entity extends string | number | symbol,
    ReadFunc extends string | number | symbol,
    WriteFunc extends string | number | symbol,
    Endpoint extends string | number | symbol
> {
    private _writeList: WriteList<Entity, WriteFunc> = []
    private _readList: ReadList<Entity, ReadFunc> = []

    private _endpointInfoList: EndpointInformationList<Endpoint, ReadFunc, WriteFunc> = []

    // private _socket: Server | null = null

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

        //TODO to remove
        // this._socket = new Server(args.httpServer, {
        //     cors: {
        //         origin: '*',
        //         methods: ['GET'],
        //         allowedHeaders: ['Content-Type'],
        //         credentials: !args.config.development
        //     },
        //     transports: ['websocket']
        // })

        // console.log(this._socket)
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

    handleUrl(args: { url: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE' }) {
        const { url, method } = args

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

        return this.detectCall({ name: functionName })
    }
}
