import { GuildConfig } from "./config"
import { DB, redis } from "./db"
import { User } from "./user"

export default abstract class KeyvRecord<T extends User | GuildConfig> {
    // static data: any[]
    public guildId: string
    public loaded: boolean
    public key: string

    constructor(guildId: string) {
        this.guildId = guildId
    }

    abstract get table(): string
    abstract get data(): any // the data you want to store
    abstract onLoad(data: any): void
    abstract onCreate(): void
    abstract onUpdate(): void

    public async onBeforeCreate(): Promise<boolean> { return true }

    public static async findAllByGuild<T extends User | GuildConfig>(type: { new(g: string): T }, guildId: string): Promise<T[]> {
        const promise = new Promise<T[]>((resolve, reject) => {
            let _items: Promise<T>[] = []
            const clazz = new type("")
            const stream = redis.scanStream({
                match: `${clazz.table}:${guildId}*`
            })

            stream.on("data", async (resultKeys) => {
                for (let i = 0; i < resultKeys.length; i++) {
                    const match = resultKeys[i].match(new RegExp(`${clazz.table}:[0-9]+:(.*)`))
                    if (match) {
                        let item = KeyvRecord.findByKey<T>(type, match[1], guildId)
                        _items.push(item)
                    }
                }
            })

            stream.on("end", () => {
                resolve(Promise.all(_items))
            })
        })

        return promise
    }

    public static async findByKey<T extends User | GuildConfig>(type: { new(g: string): T }, key: string, guildId: string): Promise<T> {
        const model = new type(guildId)

        if (!key) return null
        let data = await DB(model.table, guildId).get(key)
        if (!data) return null

        model.key = key
        model.loaded = true
        model.onLoad(data)
        return model
    }

    public static async clear<T extends User | GuildConfig>(type: { new(g: string): T },guildId: string): Promise<void> {
        const model = new type(guildId)
        return await DB(model.table, guildId).clear()
    }

    public async exists(): Promise<boolean> {
        const rsp = await DB(this.table, this.guildId).get(this.key)
        if (!rsp) {
            return false
        }

        return true
    }

    public async save(): Promise<boolean> {
        if (!this.key) {
            return false
        }

        // initial insert
        if (!this.loaded) {
            if (await this.exists() || !(await this.onBeforeCreate())) {
                return false
            }
            this.onCreate()
        }
        else {
            this.onUpdate()
        }

        this.loaded = true
        return await DB(this.table, this.guildId).set(this.key, this.data)
    }

    public async delete(): Promise<boolean> {
        return await DB(this.table, this.guildId).delete(this.key)
    }
}