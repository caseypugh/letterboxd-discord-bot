import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction, Client } from "discord.js";
import { User } from "src/data/user";
import { errorMessageEmbed } from "src/lib/error";
import { Command } from "./command";

const userParam = 'user'
export const AddUserCommand: Command = {
    command: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a Letterboxd user')
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

        let user = await User.get(username, guildId)

        // If user doesnt exist...
        if (!user) {
            user = new User(guildId)
            user.username = username
        }

        if (!user.username) {
            await interaction.followUp({
                ephemeral: true,
                embeds: [errorMessageEmbed(`Invalid Letterboxd account.`)]
            })
            return
        }

        const success = await user.save()

        if (success) {
            await interaction.followUp({
                ephemeral: true,
                content: `${user.letterboxdUrl} added!`
            })
        }
        else {

            await interaction.followUp({
                ephemeral: true,
                embeds: [errorMessageEmbed(`Couldn't find \`${user.username}\` on Letterboxd.`)]
            })
        }
    }
}