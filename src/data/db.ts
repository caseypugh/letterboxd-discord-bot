import Keyv from "keyv"
import KeyvRedis from "@keyv/redis"
import Redis from "ioredis"

import 'dotenv/config'

export const redis = new Redis(process.env.REDIS_URL)
const keyvRedis = new KeyvRedis(redis)

const dbs = {}
export const DB = function (namespace: string, guildId: string): Keyv {
    const _namespace = `${namespace}:${guildId}`

    if (!dbs[_namespace]) {
        dbs[_namespace] = new Keyv({
            namespace: _namespace,
            serialize: JSON.stringify,
            deserialize: JSON.parse,
            store: keyvRedis
        })
    }

    return dbs[_namespace]
}