import { UpdateCall } from '../src'
import { WriteFunc } from './types'
import { Entity } from './entities'

//typing express Locals
export namespace Express {
    interface Locals {
        currentListenerId?: string
        updateCall?: UpdateCall<Entity, WriteFunc>
    }
}
