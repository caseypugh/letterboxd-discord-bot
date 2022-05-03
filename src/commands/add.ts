import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction, Client, TextChannel } from "discord.js";
import delay from "promise-delay-ts";
import { User } from "src/data/user";
import { errorMessageEmbed } from "src/lib/error";
import { Command } from "./command";

const userParam = 'user'
export const AddUserCommand: Command = {
    command: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a Letterboxd user.')
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
        else {
            await interaction.followUp({
                ephemeral: true,
                content: `\`${user.username}\` is already added!`
            })
            return
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
                content: `\`${user.username}\` added!`
            })

            // It's a new user, so post publicly to the channel
            await delay(3000)

            const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID) as TextChannel
            channel.send({
                content: `Subscribed to new diary entries from ${user.letterboxdUrl}`
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