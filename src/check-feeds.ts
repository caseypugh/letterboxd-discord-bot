
import { Client, MessageEmbed, TextChannel } from 'discord.js'
import { User } from './data/user'
import delay from 'promise-delay-ts'
import TimeAgo from 'javascript-time-ago'

import en from 'javascript-time-ago/locale/en.json'
import { ItemType } from './lib/rss'
import { GuildConfig } from "./data/config"
TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US')

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
        console.log('Checking guild', guild.name, '....')

        const guildConfig = await GuildConfig.findOrCreate(guild.id)
        let channel = guild.systemChannel

        // Use custom channel if set
        if (guildConfig.channelId) {
            channel = guild.channels.cache.get(guildConfig.channelId) as TextChannel
        }

        const users = await User.allStale(guild.id)

        for (let user of users) {
            await delay(500)
            const items = await user.getLatestDiaryEntries()

            user.lastCheckedAt = new Date().getTime()
            user.save()

            for await (const item of items) {
                // Format and post new items to the Discord channel
                await delay(1000)
                let message = `${item.creator} watched ${item.filmTitle} ${item.link}`
                console.log('=>', item, message)

                const rewatched = item.rewatch ? 'rewatched' : 'watched'
                let timeAgoStr = ''
                if (item.watchedOn != null) {
                    timeAgoStr = ` ${timeAgo.format(item.watchedOn)}.`
                }
                const desc = `[${item.creator}](${user.letterboxdUrl}) ${rewatched}${timeAgoStr}.`

                let review = item.type == ItemType.Review ? `\n\n> ${item.review.replace(/\n/mg, '\n\n').replace(/\n/mg, '\n> ')}` : ''

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
                    .setColor('#FF7E02')

                await channel.send({
                    embeds: [embed]
                })

                user.updatedAt = new Date().getTime()
                user.save()
            }
        }
    }

    processing = false
}
