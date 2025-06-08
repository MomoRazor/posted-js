export interface Call<ReadFunc extends string | number | symbol> {
    id: string
    name: ReadFunc
    originalPull: () => Promise<string>
}

export type CallList<ReadFunc extends string | number | symbol> = Call<ReadFunc>[]
