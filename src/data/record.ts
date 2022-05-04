import { DB, redis } from "./db"
import { User } from "./user"

export default abstract class KeyvRecord<T extends User> {
    // static data: any[]
    public guildId: string
    public loaded: boolean
    public key: string

    constructor(guildId: string) {
        this.guildId = guildId
    }

    abstract get data(): any // the data you want to store
    abstract onLoad(data: any): void
    abstract onCreate(): void
    abstract onUpdate(): void

    public async onBeforeCreate(): Promise<boolean> { return true }

    public static async findAllByGuild<T extends User>(type: { new(g: string): T }, guildId: string): Promise<T[]> {
        const promise = new Promise<T[]>((resolve, reject) => {
            let _items: Promise<T>[] = []
            console.log(type)
            const stream = redis.scanStream({
                match: `users:${guildId}*`
            })

            stream.on("data", async (resultKeys) => {
                for (let i = 0; i < resultKeys.length; i++) {
                    const match = resultKeys[i].match(/users:[0-9]+:(.*)/)
                    if (match) {
                        let user = KeyvRecord.findByKey<T>(type, match[1], guildId)
                        _items.push(user)
                    }
                }
            })

            stream.on("end", () => {
                resolve(Promise.all(_items))
            })
        })

        return promise
    }

    public static async findByKey<T extends User>(type: { new(g: string): T }, key: string, guildId: string): Promise<T> {
        if (!key) return null
        let data = await DB('users', guildId).get(key)
        if (!data) return null

        const model = new type(guildId)
        model.key = key
        model.loaded = true
        model.onLoad(data)
        return model
    }

    public static async clear(guildId: string): Promise<void> {
        return await DB('users', guildId).clear()
    }

    public async exists(): Promise<boolean> {
        return (await User.get(this.key, this.guildId)) != null
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
            // console.log(`${this._username} updated`)
            this.onUpdate()
        }

        this.loaded = true
        return await DB('users', this.guildId).set(this.key, this.data)
    }

    public async delete(): Promise<boolean> {
        return await DB('users', this.guildId).delete(this.key)
    }


}