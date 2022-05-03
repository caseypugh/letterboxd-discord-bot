import { Client, Guild } from "discord.js"
import { User } from "src/data/user"

export default (client: Client): void => {
    client.on("guildDelete", async (guild: Guild) => {
        console.log("Left Guild", guild.name, guild.id)

        await User.clear(guild.id)

        console.log("All users deleted")
    })
}
