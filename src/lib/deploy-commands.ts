import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { Commands } from "src/commands/command"
import "dotenv/config"

const clientId = process.env.DISCORD_CLIENT_ID as string

const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN!)

export async function DeployCommands(guildId: string): Promise<void> {
	try {
		console.log(`Deploying slash commands to ${guildId} ...`)
		let body = Commands.map((c) => c.command.toJSON())

		// Force refresh commands by mutating cache
		if (process.env.ENV == "dev") {
			// body = Commands.map(c => {
			// 	console.log(c.command.description)
			// 	return c.command.toJSON()
			// })
		}

		const resp = await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
			body: body,
		})
		// console.log(resp)
	} catch (error) {
		console.error(error)
	}
}
