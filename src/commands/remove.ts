import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction, Client } from "discord.js";
import { errorMessageEmbed } from "src/lib/error";
import { User } from "../data/user";
import { Command } from "./command";

const userParam = 'user'
export const RemoveUserCommand: Command = {
    command: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a Letterboxd user')
        .addStringOption((option) => option
            .setName(userParam)
            .setDescription('Enter the Letterboxd username or URL')
            .setRequired(true)
        ),

    run: async (client: Client, interaction: BaseCommandInteraction) => {
        await interaction.deferReply({
            ephemeral: true
        })

        const username = interaction.options.get(userParam).value.toString()
        const guildId = interaction.guildId

        const user = await User.get(username, guildId)

        if (!user) {
            await interaction.followUp({
                ephemeral: true,
                embeds: [ errorMessageEmbed(`Couldn't find \`${username }\`!`) ]
            })
            return
        }
        const success = await user.delete()
        await interaction.followUp({
            ephemeral: true,
            content: `\`${username}\` removed!`
        })
    }

}