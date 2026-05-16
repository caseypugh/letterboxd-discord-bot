import { Client, Guild } from "discord.js"

export default (client: Client): void => {
	client.on("guildCreate", async (guild: Guild) => {
		console.log("=> Joined a new Guild!", guild.name, guild.id)

		// Load latest guilds into cache
		await client.guilds.fetch()
	})
}
