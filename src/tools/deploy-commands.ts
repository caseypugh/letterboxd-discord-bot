import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { DeployCommands } from "src/lib/deploy-commands"
import "dotenv/config"

type PartialGuild = { id: string; name: string }

async function main() {
	const token = process.env.DISCORD_TOKEN
	if (!token) {
		console.error("DISCORD_TOKEN is not set")
		process.exit(1)
	}

	const rest = new REST({ version: "9" }).setToken(token)

	const pageSize = 200
	const guilds: PartialGuild[] = []
	let after: string | undefined

	while (true) {
		const query = new URLSearchParams({ limit: String(pageSize) })
		if (after) query.set("after", after)

		const page = (await rest.get(Routes.userGuilds(), { query })) as PartialGuild[]
		guilds.push(...page)

		if (page.length < pageSize) break
		after = page[page.length - 1].id
	}

	console.log(`Deploying to ${guilds.length} guild(s)...`)

	for (const guild of guilds) {
		await DeployCommands(guild.id)
	}

	console.log("Done.")
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
