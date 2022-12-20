import { SlashCommandBuilder } from "@discordjs/builders"
import { BaseCommandInteraction, Client, MessageEmbed } from "discord.js"
import { Command } from "./command"
import prisma from "src/lib/prisma"
import { Users } from "src/models/user"
import { letterboxdUrl } from "src/lib/letterboxd"

export const ListUsersCommand: Command = {
	command: new SlashCommandBuilder().setName("list").setDescription("List all added Letterboxd users"),

	run: async (client: Client, interaction: BaseCommandInteraction) => {
		await interaction.deferReply({
			ephemeral: true,
		})

		if (interaction.guildId === null) {
			await interaction.followUp({
				ephemeral: true,
				content: `No guildId found`,
			})
			return
		}

		const guildId = interaction.guildId

		let content = ""

		const users = await prisma.user.findMany({
			where: { guildId },
			orderBy: { username: "asc" },
		})

		for await (let user of users) {
			content += `- [${user.username}](${letterboxdUrl(user)})\n`
		}

		const embed = new MessageEmbed().setTitle("Letterboxd Users").setDescription(content).setColor("#FF7E02")

		await interaction.followUp({
			ephemeral: false,
			embeds: [embed],
		})
	},
}
