import { Client, Intents, TextChannel } from "discord.js"
import { User } from "@prisma/client"
import { getLatestDiaryEntries } from "../lib/letterboxd"
import { buildDiaryEmbed, resolveEmojis } from "../lib/embed"
import "dotenv/config"

// End-to-end test: fetch a real Letterboxd RSS feed and post the most recent
// entries to a Discord channel using the same embed format as check-feeds.ts.
// Usage:
//   pnpm test-feed <channelId>            # cpu, 3 entries
//   pnpm test-feed <channelId> 10         # cpu, 10 entries
//   pnpm test-feed <channelId> bdougherty # bdougherty, 3 entries
//   pnpm test-feed <channelId> bdougherty 10
// Run with no args to list channels the bot can post to.

async function main() {
	const token = process.env.DISCORD_TOKEN
	if (!token) {
		console.error("DISCORD_TOKEN is not set")
		process.exit(1)
	}

	const channelId = process.argv[2]
	const listOnly = !channelId || channelId === "--list"

	// Args 3 and 4 are either [username, count] or [count] alone — a bare
	// numeric in position 3 means count, so `pnpm test-feed <id> 10` works.
	const rest = process.argv.slice(3)
	const numericIdx = rest.findIndex((a) => /^\d+$/.test(a))
	const count = numericIdx >= 0 ? parseInt(rest[numericIdx], 10) : 3
	const username = rest.find((a, i) => i !== numericIdx) ?? "cpu"

	const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
	const ready = new Promise<void>((resolve) => client.once("ready", () => resolve()))
	console.log("logging in...")
	await client.login(token)
	await ready
	console.log(`logged in as ${client.user?.tag}`)

	if (listOnly) {
		const guilds = await client.guilds.fetch()
		if (guilds.size === 0) {
			console.log("\nBot is in no guilds yet. Invite it with:")
			console.log(`  https://discord.com/oauth2/authorize?client_id=${client.user?.id}&permissions=274877910016&scope=bot+applications.commands`)
		} else {
			console.log(`\nBot is in ${guilds.size} guild(s). Text channels you can post to:`)
			for (const [, partialGuild] of guilds) {
				const guild = await partialGuild.fetch()
				await guild.channels.fetch()
				console.log(`\n  ${guild.name} (${guild.id})`)
				for (const [, ch] of guild.channels.cache) {
					if (ch?.isText()) console.log(`    ${ch.id}  #${ch.name}`)
				}
			}
			console.log("\nRe-run with: npx ts-node src/tools/test-feed.ts <channelId> [username=cpu] [count=3]")
		}
		await client.destroy()
		process.exit(0)
	}

	const channel = await client.channels.fetch(channelId).catch((e) => {
		if (e?.code === 50001) {
			console.error(
				`Missing Access: bot isn't in the guild that owns channel ${channelId}.\n` +
					`Run again with no args to list guilds the bot is in.`,
			)
			return null
		}
		throw e
	})
	if (!channel || !channel.isText()) {
		await client.destroy()
		process.exit(1)
	}
	console.log(`posting to #${(channel as TextChannel).name}`)

	await resolveEmojis(client)

	// Fake a User shape so getLatestDiaryEntries' lastCheckedAt filter passes.
	// Use a year ago — epoch 0 trips a `0 || 99999...` falsy fallback in the filter.
	const fakeUser = { username, lastCheckedAt: new Date(Date.now() - 365 * 86400000) } as User
	// getLatestDiaryEntries returns oldest-first; take the tail so `count` means
	// "most recent N", then post in chronological order (matches production).
	const items = (await getLatestDiaryEntries(fakeUser)).slice(-count)
	console.log(`fetched ${items.length} item(s) for ${username}`)

	for (const item of items) {
		await (channel as TextChannel).send({ embeds: [buildDiaryEmbed(item, fakeUser)] })
		console.log(`posted: ${item.filmTitle} (pubDate=${item.pubDate.toISOString()})`)
	}

	await client.destroy()
	process.exit(0)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
