import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import * as Sentry from "@sentry/node"
import { Commands } from "src/commands/command"
import "dotenv/config"

const clientId = process.env.DISCORD_CLIENT_ID as string

const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN!)

// Global registration populates the Commands chips on the bot's profile and
// lets </command:id> mentions resolve outside any specific guild. First publish
// can take up to ~1hr to propagate; updates are usually fast.
export async function DeployCommandsGlobal(): Promise<void> {
	try {
		console.log("Deploying slash commands globally ...")
		const body = Commands.map((c) => c.command.toJSON())
		await rest.put(Routes.applicationCommands(clientId), { body })
	} catch (error) {
		Sentry.captureException(error)
		console.error(error)
	}
}

