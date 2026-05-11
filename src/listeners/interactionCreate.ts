import { BaseCommandInteraction, Client, Interaction } from "discord.js"
import * as Sentry from "@sentry/node"
import { Commands } from "../commands/command"

export default (client: Client): void => {
	client.on("interactionCreate", async (interaction: Interaction) => {
		if (interaction.isCommand() || interaction.isContextMenu()) {
			try {
				await handleSlashCommand(client, interaction)
			} catch (e) {
				Sentry.withScope((scope) => {
					scope.setTag("command", interaction.commandName)
					scope.setContext("interaction", {
						guildId: interaction.guildId ?? undefined,
						userId: interaction.user.id,
					})
					Sentry.captureException(e)
				})
				console.error(e)
			}
		}
	})
}

const handleSlashCommand = async (client: Client, interaction: BaseCommandInteraction): Promise<void> => {
	console.log("handleSlashCommand", interaction.commandName)
	const slashCommand = Commands.find((c) => c.command.name === interaction.commandName)

	if (!slashCommand) {
		await interaction.followUp({ content: "Command not found", ephemeral: true })
		return
	}

	await slashCommand.run(client, interaction)
}
