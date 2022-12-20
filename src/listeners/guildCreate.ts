import { Client, Guild } from "discord.js"
import { DeployCommands } from "src/lib/deploy-commands"

export default (client: Client): void => {
	client.on("guildCreate", async (guild: Guild) => {
		console.log("=> Joined a new Guild!", guild.name, guild.id)

		// Create Slash commands upon joining the server
		await DeployCommands(guild.id)

		// Load latest guilds into cache
		await client.guilds.fetch()
	})
}
