import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction, Client, MessageEmbed } from "discord.js";
import { User } from "src/data/user";
import { Command } from "./command";

export const ListUsersCommand: Command = {
    command: new SlashCommandBuilder()
        .setName('list')
        .setDescription('List all added Letterboxd users'),

    run: async (client: Client, interaction: BaseCommandInteraction) => {
        await interaction.deferReply({
            ephemeral: true
        })

        let content = "";

        const users = (await User.all(interaction.guildId))
            .sort((a, b) => a.username > b.username ? 1 : -1)

        for await (let user of users) {
            content += `- [${user.username}](${user.letterboxdUrl})\n`
        }

        const embed = new MessageEmbed()
            .setTitle("Letterboxd Users")
            .setDescription(content)
            .setColor('#FF7E02')

        await interaction.followUp({
            ephemeral: false,
            embeds: [embed]
        })
    }

}