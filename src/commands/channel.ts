import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction, Client, GuildChannel, GuildMember, MessageEmbed } from "discord.js";
import { errorMessageEmbed } from "../lib/error";
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

        const channel = interaction.options.get(param).value

        await interaction.followUp({
            embeds: [errorMessageEmbed("This doesnt work yet lol")]
        })
    }
}