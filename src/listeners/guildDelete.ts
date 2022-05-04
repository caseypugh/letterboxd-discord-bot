import { Client, Guild } from "discord.js"
import { GuildConfig } from "src/data/config"
import { User } from "src/data/user"

export default (client: Client): void => {
    client.on("guildDelete", async (guild: Guild) => {
        console.log("Left Guild", guild.name, guild.id)

        await User.clear(User, guild.id)
        console.log("Users deleted")
        await GuildConfig.clear(GuildConfig, guild.id)
        console.log("Guild config deleted")

        // Load latest guilds into cache
        await client.guilds.fetch()
    })
}
