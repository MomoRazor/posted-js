import { EndpointInformationList, ReadList } from '../src/types'
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

export type Endpoint =
    | '/books'
    | '/books/:id'
    | '/users'
    | '/users/:id'
    | '/lendings'
    | '/lendings/:id'
    | '/lendings/:id/extend'
    | '/lendings/:id/finish'

export const endpointInfoList: EndpointInformationList<Endpoint, ReadFunc, WriteFunc> = [
    {
        endpoint: '/books',
        method: 'GET',
        function: 'getBooks'
    },
    {
        endpoint: '/books/:id',
        method: 'GET',
        function: 'getBookById'
    },
    {
        endpoint: '/users',
        method: 'GET',
        function: 'getUsers'
    },
    {
        endpoint: '/users/:id',
        method: 'GET',
        function: 'getUserById'
    },
    {
        endpoint: '/lendings',
        method: 'GET',
        function: 'getLendings'
    },
    {
        endpoint: '/lendings/:id',
        method: 'GET',
        function: 'getLendingById'
    },
    {
        endpoint: '/books',
        method: 'POST',
        function: 'createBook'
    },
    {
        endpoint: '/users',
        method: 'POST',
        function: 'createUser'
    },
    {
        endpoint: '/lendings',
        method: 'POST',
        function: 'createLending'
    },
    {
        endpoint: '/books/:id',
        method: 'PUT',
        function: 'updateBook'
    },
    {
        endpoint: '/users/:id',
        method: 'PUT',
        function: 'updateUser'
    },
    {
        endpoint: '/lendings/:id/extend',
        method: 'PUT',
        function: 'extendLending'
    },
    {
        endpoint: '/lendings/:id/finish',
        method: 'PUT',
        function: 'finishLending'
    },
    {
        endpoint: '/books/:id',
        method: 'DELETE',
        function: 'deleteBook'
    },
    {
        endpoint: '/users/:id',
        method: 'DELETE',
        function: 'deleteUser'
    },
    {
        endpoint: '/lendings/:id',
        method: 'DELETE',
        function: 'deleteLending'
    }
]
