import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction, Channel, Client, TextChannel } from "discord.js";
import { GuildConfig } from "src/data/config";
import { errorMessageEmbed } from "src/lib/error";
import { Command } from "./command";

const param = 'channel'
export const ChannelCommand: Command = {
    command: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Change the default channel diary entries get posted to')
        .addChannelOption((option) => option
            .setName(param)
            .setDescription('The channel to post to')
            .setRequired(true)
        ),

    run: async (client: Client, interaction: BaseCommandInteraction) => {
        await interaction.deferReply({
            ephemeral: true
        })

        const channelId = interaction.options.get(param).value
        const channel = await client.channels.fetch(channelId as string)

        if (channel.type != "GUILD_TEXT") {
            await interaction.followUp({
                embeds: [errorMessageEmbed(`Can't assign Letterboxd to ${channel.type}.`)]
            })
            return
        }

        if (!interaction.guild.me.permissionsIn(channel).has(["SEND_MESSAGES", "VIEW_CHANNEL"])) {
            await interaction.followUp({
                embeds: [errorMessageEmbed(`Letterboxd doesnt have permission to post to this channel.`)]
            })
            return
        }

        const config = await GuildConfig.findOrCreate(interaction.guildId)
        config.channelId = channelId as string
        const success = await config.save()

        if (success) {
            await interaction.followUp({
                content: `Default channel changed to <#${channel.id}>`
            })
        }
        else {
            await interaction.followUp({
                embeds: [errorMessageEmbed("Hm, something went wrong")]
            })
        }
    }
}