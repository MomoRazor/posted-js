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

// export type WriteFactory<WriteFunc extends string | number | symbol> = {
//     [name in WriteFunc]: Function
// }
// export type ReadFactory<ReadFunc extends string | number | symbol> = {
//     [name in ReadFunc]: ()
// }
