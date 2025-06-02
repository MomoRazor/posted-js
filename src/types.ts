export interface Read<
    Entity extends string | number | symbol,
    ReadFunc extends string | number | symbol = Entity
> {
    name: ReadFunc
    dependencies?: Entity[]
}

export interface Write<
    Entity extends string | number | symbol,
    WriteFunc extends string | number | symbol = Entity
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
