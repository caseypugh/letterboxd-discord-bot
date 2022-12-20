import { User } from "@prisma/client"
import Parser from "rss-parser"
import { ItemType, parseItem, RSSItem } from "src/lib/rss"
import fetch from "node-fetch"

export async function getLatestDiaryEntries(user: User): Promise<RSSItem[]> {
	console.log(`Fetching RSS feed for ${user.username} - ${letterboxdRssUrl(user)}`)
	const parser = new Parser({
		customFields: {
			item: [
				["letterboxd:rewatch", "rewatch"],
				["letterboxd:watchedDate", "watchedDate"],
				["letterboxd:filmTitle", "filmTitle"],
				["letterboxd:filmYear", "filmYear"],
				["letterboxd:memberRating", "memberRating"],
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
		console.error(e)
		return feed
	}
	return feed.filter((item) => item.pubDate.getTime() >= (user.lastCheckedAt?.getTime() || 99999999999999))
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
