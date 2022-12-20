import { Client, Guild } from "discord.js"
import prisma from "src/lib/prisma"

export default (client: Client): void => {
	client.on("guildDelete", async (guild: Guild) => {
		console.log("Left Guild", guild.name, guild.id)

		await prisma.user.deleteMany({ where: { guildId: guild.id } })
		console.log("Users deleted")

		await prisma.guildConfig.deleteMany({ where: { guildId: guild.id } })
		console.log("Guild config deleted")

		// Load latest guilds into cache
		await client.guilds.fetch()
	})
}
