//This is test code, simulating a normal API

import mongoose from 'mongoose'
import express from 'express'
import cors from 'cors'
import http from 'http'
import morgan from 'morgan'
import { Posted } from '../src/main'
import { Book, User, Lending } from './entities'
import { endpointInfoList, readList, writeList } from './types'
import { config } from 'dotenv'
import { v4 } from 'uuid'

config()

const bookSchema = new mongoose.Schema<Book>({
    id: { type: String, required: true, unique: true, default: v4() },
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    imgUrl: { type: String, required: true }
})

const userSchema = new mongoose.Schema<User>({
    id: { type: String, required: true, unique: true, default: v4() },
    name: { type: String, required: true },
    email: { type: String, required: true }
})

const lendingSchema = new mongoose.Schema<Lending>({
    id: { type: String, required: true, unique: true, default: v4() },
    bookId: { type: String, required: true },
    userId: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    actualEndDate: { type: Date }
})

const main = async () => {
    const PORT = process.env.PORT || 3000
    const MONGO_URL = process.env.MONGO_URL

    if (!MONGO_URL) {
        console.error('MONGO_URL environment variable is not set')
        process.exit(1)
    }

    const baseConnection = await mongoose
        .createConnection(MONGO_URL, {
            dbName: 'warm-books'
        })
        .asPromise()

    const BookModel = baseConnection.model<Book>('Book', bookSchema)
    const UserModel = baseConnection.model<User>('User', userSchema)
    const LendingModel = baseConnection.model<Lending>('Lending', lendingSchema)

    const simpleService = {
        // READS with pagination and filtering
        getBooks: ({
            filter = {},
            skip = 0,
            limit = 20
        }: { filter?: Partial<Book>; skip?: number; limit?: number } = {}) =>
            BookModel.find(filter).skip(skip).limit(limit).exec(),

        getUsers: ({
            filter = {},
            skip = 0,
            limit = 20
        }: { filter?: Partial<User>; skip?: number; limit?: number } = {}) =>
            UserModel.find(filter).skip(skip).limit(limit).exec(),

        getLendings: ({
            filter = {},
            skip = 0,
            limit = 20
        }: { filter?: Partial<Lending>; skip?: number; limit?: number } = {}) =>
            LendingModel.find(filter).skip(skip).limit(limit).exec(),

        getBookById: (id: string) => BookModel.findById(id).exec(),
        getUserById: (id: string) => UserModel.findById(id).exec(),
        getLendingById: (id: string) => LendingModel.findById(id).exec(),

        // WRITES (unchanged)
        createBook: (data: Omit<Book, 'id'>) => BookModel.create(data),
        createUser: (data: Omit<User, 'id'>) => UserModel.create(data),
        createLending: (data: Omit<Lending, 'id'>) => LendingModel.create(data),

        updateBook: (id: string, data: Partial<Book>) =>
            BookModel.findByIdAndUpdate(id, data, { new: true }).exec(),
        updateUser: (id: string, data: Partial<User>) =>
            UserModel.findByIdAndUpdate(id, data, { new: true }).exec(),

        extendLending: (id: string, endDate: Date) =>
            LendingModel.findByIdAndUpdate(id, { endDate }, { new: true }).exec(),
        finishLending: (id: string, actualEndDate: Date) =>
            LendingModel.findByIdAndUpdate(id, { actualEndDate }, { new: true }).exec(),

        deleteBook: (id: string) => BookModel.findByIdAndDelete(id).exec(),
        deleteUser: (id: string) => UserModel.findByIdAndDelete(id).exec(),
        deleteLending: (id: string) => LendingModel.findByIdAndDelete(id).exec()
    }

    const app = express()
    app.use(cors<cors.CorsRequest>())
    app.use(express.json({ limit: '16mb' }))
    app.use(morgan('dev'))

    const httpServer = http.createServer(app)

    const posted = new Posted({
        httpServer,
        config: {
            endpointInfoList,
            writeList,
            readList,
            development: true // Set to false in production
        }
    })

    app.use((req, _, next) => {
        console.info(`Request received: ${req.method} ${req.originalUrl}`)
        const result = posted.handleUrl({
            url: req.originalUrl,
            method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE'
        })

        console.log('res', result)
        next()
    })

    app.get('/books', async (req, res) => {
        const { skip = 0, limit = 20, ...filter } = req.query
        const books = await simpleService.getBooks({
            filter,
            skip: Number(skip),
            limit: Number(limit)
        })
        res.json(books)
    })

    app.get('/books/:id', async (req, res) => {
        const book = await simpleService.getBookById(req.params.id)
        res.json(book)
    })

    app.post('/books', async (req, res) => {
        const book = await simpleService.createBook(req.body)
        res.json(book)
    })

    app.put('/books/:id', async (req, res) => {
        const book = await simpleService.updateBook(req.params.id, req.body)
        res.json(book)
    })

    app.delete('/books/:id', async (req, res) => {
        const result = await simpleService.deleteBook(req.params.id)
        res.json(result)
    })

    // Users
    app.get('/users', async (req, res) => {
        const { skip = 0, limit = 20, ...filter } = req.query
        const users = await simpleService.getUsers({
            filter,
            skip: Number(skip),
            limit: Number(limit)
        })
        res.json(users)
    })

    app.get('/users/:id', async (req, res) => {
        const user = await simpleService.getUserById(req.params.id)
        res.json(user)
    })

    app.post('/users', async (req, res) => {
        const user = await simpleService.createUser(req.body)
        res.json(user)
    })

    app.put('/users/:id', async (req, res) => {
        const user = await simpleService.updateUser(req.params.id, req.body)
        res.json(user)
    })

    app.delete('/users/:id', async (req, res) => {
        const result = await simpleService.deleteUser(req.params.id)
        res.json(result)
    })

    // Lendings
    app.get('/lendings', async (req, res) => {
        const { skip = 0, limit = 20, ...filter } = req.query
        const lendings = await simpleService.getLendings({
            filter,
            skip: Number(skip),
            limit: Number(limit)
        })
        res.json(lendings)
    })

    app.get('/lendings/:id', async (req, res) => {
        const lending = await simpleService.getLendingById(req.params.id)
        res.json(lending)
    })

    app.post('/lendings', async (req, res) => {
        const lending = await simpleService.createLending(req.body)
        res.json(lending)
    })

    app.put('/lendings/:id/extend', async (req, res) => {
        const { endDate } = req.body
        const lending = await simpleService.extendLending(req.params.id, new Date(endDate))
        res.json(lending)
    })

    app.put('/lendings/:id/finish', async (req, res) => {
        const { actualEndDate } = req.body
        const lending = await simpleService.finishLending(req.params.id, new Date(actualEndDate))
        res.json(lending)
    })

    app.delete('/lendings/:id', async (req, res) => {
        const result = await simpleService.deleteLending(req.params.id)
        res.json(result)
    })

    await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve))

    console.info(`Server is running on port ${PORT}`)
}

main()
