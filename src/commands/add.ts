import { SlashCommandBuilder } from "@discordjs/builders"
import { BaseCommandInteraction, Client, TextChannel } from "discord.js"
import delay from "promise-delay-ts"
import { isValidUser, letterboxdUrl, parseUsername } from "src/lib/letterboxd"
import { errorMessageEmbed } from "src/lib/error"
import { Command } from "./command"
import prisma from "src/lib/prisma"

const userParam = "user"
export const AddUserCommand: Command = {
	command: new SlashCommandBuilder()
		.setName("add")
		.setDescription("Add a Letterboxd user.")
		.addStringOption((option) =>
			option.setName(userParam).setDescription("Enter the Letterboxd username or URL.").setRequired(true)
		),

	run: async (client: Client, interaction: BaseCommandInteraction) => {
		await interaction.deferReply({
			ephemeral: true,
		})

		const username = parseUsername(interaction?.options?.get(userParam)?.value?.toString())
		const guildId = interaction.guildId

		if (!guildId) {
			await interaction.followUp({
				ephemeral: true,
				content: `No guildId found`,
			})
			return
		}

		if (!username) {
			await interaction.followUp({
				ephemeral: true,
				content: `Please enter a valid Letterboxd username or URL.`,
			})
			return
		}

		if (!(await isValidUser(username))) {
			await interaction.followUp({
				ephemeral: true,
				content: `This user does not exist on Letterboxd.`,
			})
			return
		}

		// let user = await User.get(username, guildId)
		let user = await prisma.user.findFirst({ where: { username, guildId } })

		// If user doesnt exist...
		if (!user) {
			user = await prisma.user.create({ data: { username, guildId } })
		} else {
			await interaction.followUp({
				ephemeral: true,
				content: `\`${user.username}\` is already added!`,
			})
			return
		}

		if (user) {
			await interaction.followUp({
				ephemeral: true,
				content: `\`${user.username}\` added!`,
			})

			// It's a new user, so post publicly to the channel
			await delay(3000)

			// const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID) as TextChannel
			// const config = await GuildConfig.findOrCreate(guildId)
			let config = await prisma.guildConfig.findFirst({ where: { guildId } })
			if (!config) {
				config = await prisma.guildConfig.create({ data: { guildId } })
			}

			let channel = interaction.guild?.systemChannel

			if (config.channelId) {
				channel = (await interaction.guild?.channels.fetch(config.channelId)) as TextChannel
			}

			channel?.send({
				content: `Subscribed to new diary entries from ${letterboxdUrl(user)}`,
			})
		} else {
			await interaction.followUp({
				ephemeral: true,
				embeds: [errorMessageEmbed(`Couldn't find \`${username}\` on Letterboxd.`)],
			})
		}
	},
}
