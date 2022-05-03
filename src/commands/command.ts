import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction, Client } from "discord.js";
import { AddUserCommand } from "src/commands/add";
import { ChannelCommand } from "src/commands/channel";
import { ListUsersCommand } from "src/commands/list";
import { RemoveUserCommand } from "src/commands/remove";

export interface Command {
    command: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    run: (client: Client, interaction: BaseCommandInteraction) => void
}

export const Commands: Command[] = [
    ChannelCommand,
    AddUserCommand,
    RemoveUserCommand,
    ListUsersCommand,
]
