import { SlashCommandBuilder } from "@discordjs/builders"
import { BaseCommandInteraction, Client, MessageEmbed } from "discord.js"
import { Command } from "./command"
import prisma from "src/lib/prisma"
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

		const users = await prisma.user.findMany({
			where: { guildId },
			orderBy: { username: "asc" },
		})

		let content = users.length === 0 ? "No users added yet. Use `/add` to add one." : ""

		const now = Date.now()
		for await (let user of users) {
			let line = `- [${user.username}](${letterboxdUrl(user)})`
			if (user.snoozedUntil && user.snoozedUntil.getTime() > now) {
				const unix = Math.floor(user.snoozedUntil.getTime() / 1000)
				line += ` — 💤 snoozed (ends <t:${unix}:R>)`
			}
			content += `${line}\n`
		}

		const embed = new MessageEmbed().setTitle("Letterboxd Users").setDescription(content).setColor("#FF7E02")

		await interaction.followUp({
			ephemeral: false,
			embeds: [embed],
		})
	},
}
