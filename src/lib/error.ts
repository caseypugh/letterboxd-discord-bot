import { MessageEmbed } from "discord.js";

export function errorMessageEmbed(desc: string, title: string = 'Error') {
    return new MessageEmbed()
        .setDescription(desc)
        .setTitle(title)
        .setColor('DARK_RED')
}
