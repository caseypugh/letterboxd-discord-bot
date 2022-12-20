import { SlashCommandBuilder } from "@discordjs/builders"
import { BaseCommandInteraction, Channel, Client, TextChannel } from "discord.js"
import { errorMessageEmbed } from "src/lib/error"
import { Command } from "./command"
import prisma from "src/lib/prisma"

const param = "channel"
export const ChannelCommand: Command = {
	command: new SlashCommandBuilder()
		.setName("channel")
		.setDescription("Change the default channel diary entries get posted to")
		.addChannelOption((option) =>
			option.setName(param).setDescription("The channel to post to").setRequired(true)
		),

	run: async (client: Client, interaction: BaseCommandInteraction) => {
		await interaction.deferReply({
			ephemeral: true,
		})

		const channelId = interaction.options?.get(param)?.value as string
		const channel = await client.channels.fetch(channelId as string)
		const guildId = interaction.guildId

		if (guildId == null) {
			await interaction.followUp({
				embeds: [errorMessageEmbed(`No guildId found`)],
			})
			return
		}

		if (!channel) {
			await interaction.followUp({
				embeds: [errorMessageEmbed(`Channel not found`)],
			})
			return
		}

		if (channel?.type != "GUILD_TEXT") {
			await interaction.followUp({
				embeds: [errorMessageEmbed(`Can't assign Letterboxd to ${channel?.type}.`)],
			})
			return
		}

		if (!interaction.guild?.me?.permissionsIn(channel).has(["SEND_MESSAGES", "VIEW_CHANNEL"])) {
			await interaction.followUp({
				embeds: [errorMessageEmbed(`Letterboxd doesnt have permission to post to this channel.`)],
			})
			return
		}

		// const config = await GuildConfig.findOrCreate(interaction.guildId)
		let config = await prisma.guildConfig.findFirst({ where: { guildId } })

		config = await prisma.guildConfig.upsert({
			where: { guildId },
			update: { channelId },
			create: { guildId, channelId },
		})

		if (config) {
			await interaction.followUp({
				content: `Default channel changed to <#${channel.id}>`,
			})
		} else {
			await interaction.followUp({
				embeds: [errorMessageEmbed("Hm, something went wrong")],
			})
		}
	},
}
