import Parser from "rss-parser"
import { ItemType, parseItem, RSSItem } from "src/lib/rss"
import { DB, redis } from "src/data/db"
import fetch from 'node-fetch'
import KeyvRecord from "./record"

export class User extends KeyvRecord<User> {
    public set username(value: string) {
        this.key = User.parseUsername(value)
    }

    public get username(): string {
        return this.key
    }

    public createdAt: number
    public updatedAt: number
    public lastCheckedAt?: number

    public get data(): any {
        return {
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastCheckedAt: this.lastCheckedAt
        }
    }

    public onLoad(data: any): void {
        console.log('onLoad', this.guildId, this.username, data)
        this.createdAt = new Date(data.createdAt).getTime()
        this.updatedAt = new Date(data.updatedAt).getTime()
        this.lastCheckedAt = new Date(data.lastCheckedAt).getTime()
    }

    public onCreate(): void {
        console.log('onCreate', this)
    }

    public onUpdate(): void {
        // console.log('onUpdate', this)
    }

    public override async onBeforeCreate(): Promise<boolean> {
        if (!await this.isValidUser()) {
            console.log("Not a valid Letterboxd user")
            return false
        }

        if (!this.createdAt) this.createdAt = new Date().getTime()
        if (!this.updatedAt) this.updatedAt = new Date().getTime()
        return true
    }

    public static all(guildId: string): Promise<User[]> {
        return KeyvRecord.findAllByGuild<User>(User, guildId)
    }

    public static async allStale(guildId: string): Promise<User[]> {
        const delayBeforeCheck = 60 * 10 * 1000  // 10 minutes
        const users = await User.all(guildId)

        return users.filter(user => {
            const elapsed = new Date().getTime() - (user.lastCheckedAt || 0)
            // if (elapsed <= delayBeforeCheck)
            //     console.log(`=> Skipping ${user.username} - last updated`, elapsed / 1000, 'seconds ago', user.lastCheckedAt)
            return elapsed > delayBeforeCheck
        })
    }

    public static async get(username: string, guildId: string): Promise<User> {
        const user = new User(guildId)
        user.username = username

        if (!user.username) return null
        let userData = await DB('users', guildId).get(user.username)
        if (!userData) return null

        return user
    }

    public static parseUsername(username: string): string {
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


    public get letterboxdUrl(): string {
        return `https://letterboxd.com/${this.username}/`
    }

    public get letterboxdRssUrl() :string {
        return `https://letterboxd.com/${this.username}/rss/`
    }

    public async isValidUser(): Promise<boolean> {
        const rsp = await fetch(this.letterboxdUrl, {
            method: 'HEAD'
        })
        return rsp.status != 404
    }


    public async getLatestDiaryEntries(): Promise<RSSItem[]> {
        console.log(`Fetching RSS feed for ${this.username} - ${this.letterboxdRssUrl}`);
        const parser = new Parser({
            customFields: {
                item: [
                    ['letterboxd:rewatch', 'rewatch'],
                    ['letterboxd:watchedDate', 'watchedDate'],
                    ['letterboxd:filmTitle', 'filmTitle'],
                    ['letterboxd:filmYear', 'filmYear'],
                    ['letterboxd:memberRating', 'memberRating'],
                    ['dc:creator', 'creator'],
                ]
            }
        })
        let feed: RSSItem[] = []
        try {
            const data = await parser.parseURL(this.letterboxdRssUrl)
            feed = data.items
                .map(i => parseItem(i))
                .filter(i => i.type == ItemType.Review || i.type == ItemType.Watch)
        }
        catch (e) {
            console.error(e)
            return feed
        }

        return feed.filter(item => item.pubDate.getTime() >= this.updatedAt)
    }

}