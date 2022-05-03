import { BaseCommandInteraction, Client, Interaction } from "discord.js";
import { Commands } from "../commands/command";

export default (client: Client): void => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        if (interaction.isCommand() || interaction.isContextMenu()) {
            await handleSlashCommand(client, interaction);
        }
    });
};

const handleSlashCommand = async (client: Client, interaction: BaseCommandInteraction): Promise<void> => {
    console.log('handleSlashCommand', interaction.commandName)
    const slashCommand = Commands.find(c => c.command.name === interaction.commandName);

    if (!slashCommand) {
        await interaction.followUp({ content: "Command not found", ephemeral: true });
        return;
    }

    slashCommand.run(client, interaction);
}