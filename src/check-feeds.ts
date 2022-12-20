import { Client, MessageEmbed, TextChannel } from "discord.js"
import delay from "promise-delay-ts"
import TimeAgo from "javascript-time-ago"
import en from "javascript-time-ago/locale/en.json"
import { ItemType } from "./lib/rss"
import prisma from "./lib/prisma"
import { Users } from "./models/user"
import { getLatestDiaryEntries, letterboxdRssUrl, letterboxdUrl } from "./lib/letterboxd"

TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo("en-US")

let processing: boolean = false
export const CheckFeeds = async (client: Client) => {
	if (processing) {
		console.warn("CheckFeeds already running")
		return
	}

	// console.log("\nChecking feeds ...");
	processing = true

	const guilds = client.guilds.cache
	for (const [key, guild] of guilds) {
		console.log("Checking guild", guild.name, "....")

		let guildConfig = await prisma.guildConfig.findFirst({
			where: { guildId: guild.id },
		})

		if (!guildConfig) {
			guildConfig = await prisma.guildConfig.create({
				data: { guildId: guild.id },
			})
		}

		let channel = guild.systemChannel

		// Use custom channel if set
		if (guildConfig.channelId) {
			channel = guild.channels.cache.get(guildConfig.channelId) as TextChannel
		}

		const users = await Users(prisma).allStale(guild.id)

		for (let user of users) {
			await delay(500)
			const items = await getLatestDiaryEntries(user)

			await prisma.user.update({
				where: { id: user.id },
				data: { lastCheckedAt: new Date() },
			})

			for await (const item of items) {
				// Format and post new items to the Discord channel
				await delay(1000)
				let message = `${item.creator} watched ${item.filmTitle} ${item.link}`
				console.log("=>", item, message)

				const rewatched = item.rewatch ? "rewatched" : "watched"
				let timeAgoStr = ""
				if (item.watchedOn != null) {
					timeAgoStr = ` ${timeAgo.format(item.watchedOn)}`
					if (timeAgoStr == " 1 day ago") {
						timeAgoStr = " recently"
					}
				}
				const desc = `[${item.creator}](${letterboxdUrl(user)}) ${rewatched}${timeAgoStr}.`

				let review =
					item.type == ItemType.Review
						? `\n\n> ${item.review.replace(/\n/gm, "\n\n").replace(/\n/gm, "\n> ")}`
						: ""

				if (review.length >= 4096 - desc.length) {
					const more = ` [...more](${item.link})`
					review = review.slice(0, 4092 - desc.length - more.length) + more
				}

				if (item.containsSpoilers) {
					review = `||${review}||`
				}

				let embed = new MessageEmbed()
					.setTitle(`${item.filmTitle} (${item.filmYear}) ${item.starRating}`)
					.setURL(item.link)
					.setThumbnail(item.posterImageUrl)
					.setDescription(desc + review)
					.setColor("#FF7E02")

				await channel?.send({
					embeds: [embed],
				})

				await prisma.user.update({
					where: { id: user.id },
					data: { updatedAt: new Date() },
				})
			}
		}
	}

	processing = false
}
