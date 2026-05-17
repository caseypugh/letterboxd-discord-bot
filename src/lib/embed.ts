import { Client, MessageEmbed } from "discord.js"
import { REST } from "@discordjs/rest"
import { User } from "@prisma/client"
import { ItemType, RSSItem } from "./rss"
import { letterboxdUrl } from "./letterboxd"

// Discord renders <:name:id> as a custom emoji image, otherwise as raw text.
// We resolve IDs from the bot's *application* emojis (uploaded under the bot
// in the Developer Portal) — these are scoped to the application, usable in
// every guild it's in, and separate from per-guild emojis. Convention: names
// "star" / "half" / "heart" / "rewatch". Falls back to Unicode if any are
// missing; rewatch has no good Unicode equivalent, so it falls back to empty.
const emojis = {
	star: "★",
	half: "½",
	heart: "❤️",
	rewatch: "",
}

type AppEmoji = { id: string; name: string }

export async function resolveEmojis(client: Client): Promise<void> {
	const appId = client.application?.id
	const token = process.env.DISCORD_TOKEN
	if (!appId || !token) {
		console.log("resolveEmojis: missing application id or token, using Unicode fallbacks")
		return
	}
	try {
		const rest = new REST({ version: "9" }).setToken(token)
		const result = (await rest.get(`/applications/${appId}/emojis`)) as { items: AppEmoji[] }
		console.log(`resolveEmojis: ${result.items.length} application emoji(s)`)
		for (const emoji of result.items) {
			const name = emoji.name?.toLowerCase()
			if (name === "star" || name === "half" || name === "heart" || name === "rewatch") {
				emojis[name] = `<:${emoji.name}:${emoji.id}>`
			}
		}
		console.log("Resolved emojis:", emojis)
	} catch (e) {
		console.error("resolveEmojis failed, using Unicode fallbacks:", e)
	}
}

// Same Pacific-day as pubDate → use pubDate so Discord's <t:UNIX:R> renders
// precise per-viewer relative time ("16 minutes ago", "an hour ago").
// Different day → render the watched date as literal "May 15" text (with year
// only if it crosses years). No future-date risk since it's not a timestamp.
// watchedOn from Letterboxd is tz-less YYYY-MM-DD parsed to UTC midnight; we
// treat the YMD as a Pacific calendar date for the same-day check, biasing
// toward the audience's wall clock.
function whenText(item: RSSItem): string {
	const pubTs = Math.floor(item.pubDate.getTime() / 1000)
	if (!item.watchedOn) return `<t:${pubTs}:R>`

	const pubYMD = item.pubDate.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" })
	const watchedYMD = item.watchedOn.toISOString().slice(0, 10)
	if (pubYMD === watchedYMD) return `<t:${pubTs}:R>`

	const showYear = item.watchedOn.getUTCFullYear() !== new Date().getUTCFullYear()
	const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" }
	if (showYear) opts.year = "numeric"
	return `on ${item.watchedOn.toLocaleString("en-US", opts)}`
}

function ratingEmoji(rating: number): string {
	if (!rating || isNaN(rating)) return ""
	const full = Math.floor(rating)
	const half = rating - full >= 0.5
	const parts = Array(full).fill(emojis.star)
	if (half) parts.push(emojis.half)
	// Joined with U+2060 WORD JOINER (invisible) so Discord won't wrap the rating mid-emoji.
	return parts.join("⁠")
}

export function buildDiaryEmbed(item: RSSItem, user: User): MessageEmbed {
	const rewatched = item.rewatch ? "rewatched" : "watched"
	const prefix = item.rewatch && emojis.rewatch ? `${emojis.rewatch} ` : ""
	const desc = `${prefix}[${item.creator}](${letterboxdUrl(user)}) ${rewatched} ${whenText(item)}.`

	let review =
		item.type == ItemType.Review
			? `\n\n> ${item.review.replace(/\n/gm, "\n\n").replace(/\n/gm, "\n> ")}`
			: ""

	if (review.length >= 4096 - desc.length) {
		const more = ` [...more](${item.link})`
		review = review.slice(0, 4092 - desc.length - more.length) + more
	}
	if (item.containsSpoilers) review = `||${review}||`

	const titleParts = [`${item.filmTitle} (${item.filmYear})`]
	const stars = ratingEmoji(item.rating)
	// U+2060 word joiner (invisible) between stars and heart so they don't wrap apart.
	if (stars && item.liked) titleParts.push(`${stars}⁠${emojis.heart}`)
	else if (stars) titleParts.push(stars)
	else if (item.liked) titleParts.push(emojis.heart)

	return new MessageEmbed()
		.setTitle(titleParts.join(" "))
		.setURL(item.link)
		.setThumbnail(item.posterImageUrl)
		.setDescription(desc + review)
		.setColor(item.rewatch ? "#00E054" : "#FF7E02")
}
