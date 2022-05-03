import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Commands } from './commands/command'
import 'dotenv/config'

const clientId = process.env.DISCORD_CLIENT_ID
const guildId = process.env.DISCORD_GUILD_ID

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.')

		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId), {
				body: Commands.map(c => c.command.toJSON())
			},
		)

		console.log('Successfully reloaded application (/) commands.')
	}
	catch (error) {
		console.error(error);
	}
})();