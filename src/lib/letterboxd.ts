import { User } from "@prisma/client"
import Parser from "rss-parser"
import { ItemType, parseItem, RSSItem } from "src/lib/rss"
import fetch from "node-fetch"

export class LetterboxdUserNotFoundError extends Error {}
export class LetterboxdTransientError extends Error {
	constructor(public reason: string, username: string) {
		super(`Letterboxd transient error for ${username}: ${reason}`)
	}
}

// Default rss-parser timeout is 60s — same length as our cron interval, so one
// hung Letterboxd request stalls the entire tick. Healthy feeds return in ~1s,
// so cap well below that: a slow feed is skipped fast and retried next tick
// rather than holding up everyone behind it.
const RSS_TIMEOUT_MS = 5000

export async function getLatestDiaryEntries(user: User): Promise<RSSItem[]> {
	console.log(`Fetching RSS feed for ${user.username} - ${letterboxdRssUrl(user)}`)
	const parser = new Parser({
		timeout: RSS_TIMEOUT_MS,
		headers: { "User-Agent": "letterboxd-discord-bot/1.0" },
		customFields: {
			item: [
				["letterboxd:rewatch", "rewatch"],
				["letterboxd:watchedDate", "watchedDate"],
				["letterboxd:filmTitle", "filmTitle"],
				["letterboxd:filmYear", "filmYear"],
				["letterboxd:memberRating", "memberRating"],
				["letterboxd:memberLike", "memberLike"],
				["dc:creator", "creator"],
			],
		},
	})
	let feed: RSSItem[] = []
	try {
		const data = await parser.parseURL(letterboxdRssUrl(user))
		feed = data.items
			.map((i) => parseItem(i))
			.filter((i) => i.type == ItemType.Review || i.type == ItemType.Watch)
	} catch (e) {
		if (e instanceof Error) {
			const match = e.message.match(/^Status code (\d+)$/)
			if (match) {
				const status = parseInt(match[1], 10)
				if (status === 404) throw new LetterboxdUserNotFoundError(user.username)
				if (status === 429 || status >= 500) {
					throw new LetterboxdTransientError(`status ${status}`, user.username)
				}
			}
			// rss-parser throws this exact shape on its internal timeout; treat
			// it the same as a 5xx since Letterboxd being unresponsive is the
			// same symptom as Letterboxd being down.
			if (/^Request timed out after \d+ms$/.test(e.message)) {
				throw new LetterboxdTransientError("timeout", user.username)
			}
		}
		throw e
	}
	return feed
		.filter((item) => item.pubDate.getTime() >= (user.lastCheckedAt?.getTime() || 99999999999999))
		.sort((a, b) => a.pubDate.getTime() - b.pubDate.getTime())
}

export function letterboxdRssUrl(user: User): string {
	return `https://letterboxd.com/${user.username}/rss/`
}

export function letterboxdUrl(user: User): string {
	return `https://letterboxd.com/${user.username}/`
}

export function parseUsername(username: string | null | undefined): string | null {
	if (!username) return null

	const match = username.match(/\/\/letterboxd\.com\/([a-z0-9_]+)/)
	if (match) {
		return match[1]
	}

	const cleanMatch = username.match(/([a-z0-9_]+)/i)
	if (cleanMatch) {
		return cleanMatch[1]
	}
	return null
}

export async function isValidUser(username: string): Promise<boolean> {
	const rsp = await fetch(`https://letterboxd.com/${username}/rss/`, {
		method: "HEAD",
	})
	return rsp.status != 404
}
