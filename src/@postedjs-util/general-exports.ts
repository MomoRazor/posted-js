export const headerIdKey = 'x-postedjs-id'

export interface SocketData {
    data: unknown
}

export interface PostedJsReadReturn {
    id: string
    data: unknown
}
