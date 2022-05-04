import KeyvRecord from "./record"

export class GuildConfig extends KeyvRecord<GuildConfig> {

    public channelId: string
    public static DEFAULT_KEY = "config"

    constructor(guildId: string) {
        super(guildId)
        this.key = GuildConfig.DEFAULT_KEY
    }

    public get table(): string { return "config" }

    public get data(): any {
        return {
            channelId: this.channelId
        }
    }

    public static async findOrCreate(guildId: string): Promise<GuildConfig> {
        let config = await this.find(guildId)
        if (!config) {
            config = new GuildConfig(guildId)
            await config.save()
        }
        return config
    }

    public static async find(guildId: string): Promise<GuildConfig> {
        return KeyvRecord.findByKey<GuildConfig>(GuildConfig, this.DEFAULT_KEY, guildId)
    }

    public onLoad(data: any): void {
        // console.log('onLoad', data)
        this.channelId = data.channelId
    }

    public onCreate(): void {
        console.log('onCreate', this)
    }

    public onUpdate(): void {
        console.log('onUpdate', this)
    }
}