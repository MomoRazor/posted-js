import { MongoQuery } from '@ucast/mongo2js'
import { DateTime } from 'luxon'

export interface Read<
    Entity extends string | number | symbol,
    ReadFunc extends string | number | symbol
> {
    name: ReadFunc
    dependencies?: Entity[]
}

export interface Write<
    Entity extends string | number | symbol,
    WriteFunc extends string | number | symbol
> {
    name: WriteFunc
    dependants?: Entity[]
}

export type ReadList<
    Entity extends string | number | symbol,
    ReadFunc extends string | number | symbol
> = Read<Entity, ReadFunc>[]
export type WriteList<
    Entity extends string | number | symbol,
    WriteFunc extends string | number | symbol
> = Write<Entity, WriteFunc>[]

export interface EndpointInformation<
    Endpoint extends string | number | symbol,
    ReadFunc extends string | number | symbol,
    WriteFunc extends string | number | symbol
> {
    endpoint: Endpoint
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    function: ReadFunc | WriteFunc
}

export type EndpointInformationList<
    Endpoint extends string | number | symbol,
    ReadFunc extends string | number | symbol,
    WriteFunc extends string | number | symbol
> = EndpointInformation<Endpoint, ReadFunc, WriteFunc>[]

export interface RequestData {
    query?: Record<string, any>
    body?: Record<string, any>
    params?: Record<string, any>
}

export type Optimization<Entity extends string | number | symbol> = {
    [key in Entity]?: MongoQuery
}

export interface Listener<
    Entity extends string | number | symbol,
    ReadFunc extends string | number | symbol
> {
    id: string
    name: ReadFunc
    requestData: RequestData | undefined
    lastUsed: DateTime
    dependencies?: Entity[]
    dependencyOptimization?: Optimization<Entity>
}

export type ListenerList<
    Entity extends string | number | symbol,
    ReadFunc extends string | number | symbol
> = Listener<Entity, ReadFunc>[]

export interface UpdateCall<
    Entity extends string | number | symbol,
    WriteFunc extends string | number | symbol
> extends Write<Entity, WriteFunc> {
    dependantOptimization?: {
        [key in Entity]?: Record<string, unknown>
    }
}

export type ReadFactory<ReadFunc extends string | number | symbol> = {
    [name in ReadFunc]: (requestData: RequestData | undefined) => Promise<unknown>
}
