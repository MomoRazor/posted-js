import { UpdateCall } from '../src'
import { WriteFunc } from './test-area/types'
import { Entity } from './test-area/entities'

//typing express Locals
export namespace Express {
    interface Locals {
        currentListenerId?: string
        updateCall?: UpdateCall<Entity, WriteFunc>
    }
}
