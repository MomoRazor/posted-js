//This is test code, simulating a normal API

import mongoose from 'mongoose'
import express from 'express'
import cors from 'cors'
import http from 'http'
import morgan from 'morgan'
import { Posted } from '../src/main'
import { Book, User, Lending } from './entities'

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

    const BookModel = baseConnection.model<Book & mongoose.Document>('Book')
    const UserModel = baseConnection.model<User & mongoose.Document>('User')
    const LendingModel = baseConnection.model<Lending & mongoose.Document>('Lending')

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
        writeList: [],
        readList: [],
        development: true // Set to false in production
    })

    await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve))

    console.info(`Server is running on port ${PORT}`)
}

main()
