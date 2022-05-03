import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction, Client } from "discord.js";
import { AddUserCommand } from "./add";
import { ChannelCommand } from "./channel";
import { ListUsersCommand } from "./list";
import { RemoveUserCommand } from "./remove";

export interface Command {
    command: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    run: (client: Client, interaction: BaseCommandInteraction) => void
}

export const Commands: Command[] = [
    AddUserCommand,
    RemoveUserCommand,
    ListUsersCommand,
    ChannelCommand
]
