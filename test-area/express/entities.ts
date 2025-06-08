export type Entity = 'book' | 'user' | 'lending'

export interface Book {
    id: string
    title: string
    excerpt: string
    imgUrl: string
}

export interface User {
    id: string
    name: string
    email: string
}

export interface Lending {
    id: string
    bookId: string
    userId: string
    startDate: Date
    endDate: Date
    actualEndDate?: Date
}
