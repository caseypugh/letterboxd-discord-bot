import { SlashCommandBuilder } from "@discordjs/builders"
import { BaseCommandInteraction, Client } from "discord.js"
import { errorMessageEmbed } from "src/lib/error"
import { parseUsername } from "src/lib/letterboxd"
import { Command } from "./command"
import prisma from "src/lib/prisma"

const userParam = "user"
const hoursParam = "hours"
const MAX_SNOOZE_HOURS = 24 * 30

export const SnoozeUserCommand: Command = {
	command: new SlashCommandBuilder()
		.setName("snooze")
		.setDescription("Snooze a Letterboxd user's posts for N hours (0 to unsnooze).")
		.addStringOption((option) =>
			option.setName(userParam).setDescription("Enter the Letterboxd username or URL.").setRequired(true)
		)
		.addIntegerOption((option) =>
			option
				.setName(hoursParam)
				.setDescription(`Hours to snooze, 0 to unsnooze (max ${MAX_SNOOZE_HOURS}).`)
				.setMinValue(0)
				.setMaxValue(MAX_SNOOZE_HOURS)
				.setRequired(true)
		),

	run: async (client: Client, interaction: BaseCommandInteraction) => {
		await interaction.deferReply({ ephemeral: true })

		const guildId = interaction.guildId
		if (!guildId) {
			await interaction.followUp({ ephemeral: true, content: `No guildId found` })
			return
		}

		const username = parseUsername(interaction.options.get(userParam)?.value?.toString())
		const hours = interaction.options.get(hoursParam)?.value as number | undefined

		if (!username) {
			await interaction.followUp({
				ephemeral: true,
				content: `Please enter a valid Letterboxd username or URL.`,
			})
			return
		}

		if (hours === undefined || hours < 0 || hours > MAX_SNOOZE_HOURS) {
			await interaction.followUp({
				ephemeral: true,
				content: `Hours must be between 0 and ${MAX_SNOOZE_HOURS}.`,
			})
			return
		}

		const user = await prisma.user.findFirst({ where: { username, guildId } })
		if (!user) {
			await interaction.followUp({
				ephemeral: true,
				embeds: [errorMessageEmbed(`\`${username}\` isn't on this server's list.`)],
			})
			return
		}

		if (hours === 0) {
			// Bump lastCheckedAt to now so the next tick won't backfill the snooze window.
			await prisma.user.update({
				where: { id: user.id },
				data: { snoozedUntil: null, lastCheckedAt: new Date() },
			})
			await interaction.followUp({
				ephemeral: true,
				content: `\`${user.username}\` unsnoozed.`,
			})
			return
		}

		const snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000)
		// Set lastCheckedAt = snoozedUntil so when snooze ends, getLatestDiaryEntries'
		// `pubDate >= lastCheckedAt` filter suppresses anything posted during the window.
		await prisma.user.update({
			where: { id: user.id },
			data: { snoozedUntil, lastCheckedAt: snoozedUntil },
		})

		const unix = Math.floor(snoozedUntil.getTime() / 1000)
		await interaction.followUp({
			ephemeral: true,
			content: `\`${user.username}\` snoozed until <t:${unix}:f> (<t:${unix}:R>).`,
		})
	},
}
