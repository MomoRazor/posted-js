import { ReadList } from '../src/types'
import { Entity } from './entities'

export type ReadFunc =
    | 'getBooks'
    | 'getUsers'
    | 'getLendings'
    | 'getBookById'
    | 'getUserById'
    | 'getLendingById'
export type WriteFunc =
    | 'createBook'
    | 'createUser'
    | 'createLending'
    | 'updateBook'
    | 'updateUser'
    | 'extendLending'
    | 'finishLending'
    | 'deleteBook'
    | 'deleteUser'
    | 'deleteLending'

export const readList: ReadList<Entity, ReadFunc> = [
    {
        name: 'getBooks',
        dependencies: ['book']
    },
    {
        name: 'getUsers',
        dependencies: ['user']
    },
    {
        name: 'getLendings',
        dependencies: ['lending', 'book', 'user']
    },
    {
        name: 'getBookById',
        dependencies: ['book', 'lending']
    },
    {
        name: 'getUserById',
        dependencies: ['user', 'lending']
    },
    {
        name: 'getLendingById',
        dependencies: ['lending', 'book', 'user']
    }
] as const

export const writeList: ReadList<Entity, WriteFunc> = [
    {
        name: 'createBook',
        dependencies: ['book']
    },
    {
        name: 'createUser',
        dependencies: ['user']
    },
    {
        name: 'createLending',
        dependencies: ['lending']
    },
    {
        name: 'updateBook',
        dependencies: ['book']
    },
    {
        name: 'updateUser',
        dependencies: ['user']
    },
    {
        name: 'extendLending',
        dependencies: ['lending']
    },
    {
        name: 'finishLending',
        dependencies: ['lending']
    },
    {
        name: 'deleteBook',
        dependencies: ['book']
    },
    {
        name: 'deleteUser',
        dependencies: ['user']
    },
    {
        name: 'deleteLending',
        dependencies: ['lending']
    }
] as const
