//This is test code, simulating a normal API

import mongoose from 'mongoose'
import express, { Send } from 'express'
import cors from 'cors'
import http from 'http'
import morgan from 'morgan'
import { Posted, headerIdKey, RequestData } from '../src'
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
        getBooks: ({ query = {} }: RequestData = {}) => {
            const { filter = {}, skip = 0, limit = 20 } = query
            return BookModel.find(filter).skip(Number(skip)).limit(Number(limit)).exec()
        },

        getUsers: ({ query = {} }: RequestData = {}) => {
            const { filter = {}, skip = 0, limit = 20 } = query
            return UserModel.find(filter).skip(Number(skip)).limit(Number(limit)).exec()
        },

        getLendings: ({ query = {} }: RequestData = {}) => {
            const { filter = {}, skip = 0, limit = 20 } = query
            return LendingModel.find(filter).skip(Number(skip)).limit(Number(limit)).exec()
        },

        getBookById: ({ params = {} }: RequestData = {}) => BookModel.findById(params.id).exec(),

        getUserById: ({ params = {} }: RequestData = {}) => UserModel.findById(params.id).exec(),

        getLendingById: ({ params = {} }: RequestData = {}) =>
            LendingModel.findById(params.id).exec(),

        // WRITES
        createBook: ({ body = {} }: RequestData = {}) => BookModel.create(body),

        createUser: ({ body = {} }: RequestData = {}) => UserModel.create(body),

        createLending: ({ body = {} }: RequestData = {}) => LendingModel.create(body),

        updateBook: ({ params = {}, body = {} }: RequestData = {}) =>
            BookModel.findByIdAndUpdate(params.id, body, { new: true }).exec(),

        updateUser: ({ params = {}, body = {} }: RequestData = {}) =>
            UserModel.findByIdAndUpdate(params.id, body, { new: true }).exec(),

        extendLending: ({ params = {}, body = {} }: RequestData = {}) =>
            LendingModel.findByIdAndUpdate(
                params.id,
                { endDate: new Date(body.endDate) },
                { new: true }
            ).exec(),

        finishLending: ({ params = {}, body = {} }: RequestData = {}) =>
            LendingModel.findByIdAndUpdate(
                params.id,
                { actualEndDate: new Date(body.actualEndDate) },
                { new: true }
            ).exec(),

        deleteBook: ({ params = {} }: RequestData = {}) =>
            BookModel.findByIdAndDelete(params.id).exec(),

        deleteUser: ({ params = {} }: RequestData = {}) =>
            UserModel.findByIdAndDelete(params.id).exec(),

        deleteLending: ({ params = {} }: RequestData = {}) =>
            LendingModel.findByIdAndDelete(params.id).exec()
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

    //TODO this needs to be consolidated within the package
    // Middleware to intercept res.send
    app.use((req, res, next) => {
        if (!res.locals.currentListenerId) {
            next()
        } else {
            //TODO to implement both sending id when reading (for future updates)
            // and emitting socket options when writing - this requires writing event detection logic
            const originalSend = res.send.bind(res)

            res.send = function (body?: any): any {
                // You can inspect or modify 'body' here
                console.info(`Response for ${req.method} ${req.originalUrl}:`, body)

                // Optionally, modify the body before sending
                // body = { ...body, intercepted: true };

                return originalSend(body)
            }

            next()
        }
    })

    //TODO this needs to be consolidated within the package
    app.use((req, res, next) => {
        console.info(`Request received: ${req.method} ${req.originalUrl}`)

        const id = req.headers[headerIdKey] as string | undefined
        const result = posted.handleUrl({
            id,
            url: req.originalUrl,
            method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
            requestData: {
                query: req.query,
                body: req.body,
                params: req.params
            }
        })

        res.locals.currentListenerId = result?.listener?.id
        res.locals.updateCall = result?.updateCall

        next()
    })

    // Books
    app.get('/books', async (req, res) => {
        const books = await simpleService.getBooks({ query: req.query })
        res.json(books)
    })

    app.get('/books/:id', async (req, res) => {
        const book = await simpleService.getBookById({ params: req.params })
        res.json(book)
    })

    app.post('/books', async (req, res) => {
        const book = await simpleService.createBook({ body: req.body })
        res.json(book)
    })

    app.put('/books/:id', async (req, res) => {
        const book = await simpleService.updateBook({ params: req.params, body: req.body })
        res.json(book)
    })

    app.delete('/books/:id', async (req, res) => {
        const result = await simpleService.deleteBook({ params: req.params })
        res.json(result)
    })

    // Users
    app.get('/users', async (req, res) => {
        const users = await simpleService.getUsers({ query: req.query })
        res.json(users)
    })

    app.get('/users/:id', async (req, res) => {
        const user = await simpleService.getUserById({ params: req.params })
        res.json(user)
    })

    app.post('/users', async (req, res) => {
        const user = await simpleService.createUser({ body: req.body })
        res.json(user)
    })

    app.put('/users/:id', async (req, res) => {
        const user = await simpleService.updateUser({ params: req.params, body: req.body })
        res.json(user)
    })

    app.delete('/users/:id', async (req, res) => {
        const result = await simpleService.deleteUser({ params: req.params })
        res.json(result)
    })

    // Lendings
    app.get('/lendings', async (req, res) => {
        const lendings = await simpleService.getLendings({ query: req.query })
        res.json(lendings)
    })

    app.get('/lendings/:id', async (req, res) => {
        const lending = await simpleService.getLendingById({ params: req.params })
        res.json(lending)
    })

    app.post('/lendings', async (req, res) => {
        const lending = await simpleService.createLending({ body: req.body })
        res.json(lending)
    })

    app.put('/lendings/:id/extend', async (req, res) => {
        const lending = await simpleService.extendLending({ params: req.params, body: req.body })
        res.json(lending)
    })

    app.put('/lendings/:id/finish', async (req, res) => {
        const lending = await simpleService.finishLending({ params: req.params, body: req.body })
        res.json(lending)
    })

    app.delete('/lendings/:id', async (req, res) => {
        const result = await simpleService.deleteLending({ params: req.params })
        res.json(result)
    })

    await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve))

    console.info(`Server is running on port ${PORT}`)
}

main()
