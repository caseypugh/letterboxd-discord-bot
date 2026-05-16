import "./instrument"
import * as Sentry from "@sentry/node"
import { Client, Options, Permissions, InviteScope } from "discord.js"
import interactionCreate from "./listeners/interactionCreate"
import { CronJob } from "cron"
import { CheckFeeds } from "./check-feeds"
import { DeployCommandsGlobal } from "./lib/deploy-commands"
import { resolveEmojis } from "./lib/embed"
import guildCreate from "./listeners/guildCreate"
import guildDelete from "./listeners/guildDelete"
import error from "./listeners/error"
import "dotenv/config"

console.log("Letterboxd is starting...")
const permissions =	Permissions.FLAGS.SEND_MESSAGES 

const scopes: InviteScope[] = ["bot", "applications.commands"]

console.log(
	`Add bot to server => https://discord.com/api/oauth2/authorize?client_id=${
		process.env.DISCORD_CLIENT_ID
	}&permissions=${permissions}&scope=${scopes.join("%20")}`
)

const client = new Client({
	intents: ["GUILDS"],
	// channel.send() results pile up in MessageManager forever; we never read
	// them back, so cap to 0 to bound heap.
	makeCache: Options.cacheWithLimits({
		...Options.defaultMakeCacheSettings,
		MessageManager: 0,
	}),
})

client.on("ready", async () => {
	console.log(`\n----------- ${client.user?.username} is online -----------`)

	if (!client.user || !client.application) {
		return
	}

	await resolveEmojis(client)
	await DeployCommandsGlobal()

	// Run the feed check every minute
	const job = CronJob.from({
		cronTime: "0 */1 * * * *",
		onTick: async () => {
			console.log("\n~~~~~~~~~ CronJob starting ~~~~~~~~~")
			try {
				await CheckFeeds(client)
			} catch (e) {
				Sentry.captureException(e)
				console.error(e)
			}
			console.log("~~~~~~~~~ CronJob finished ~~~~~~~~~")
		},
		runOnInit: true,
	})
	job.start()
})

interactionCreate(client)
guildCreate(client)
guildDelete(client)
error(client)

client.login(process.env.DISCORD_TOKEN)
