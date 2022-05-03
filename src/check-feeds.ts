
import { Client, MessageEmbed, TextChannel } from "discord.js"
import { User } from "./data/user"
import Parser from "rss-parser"
import delay from "promise-delay-ts"
import TimeAgo from 'javascript-time-ago'

import en from 'javascript-time-ago/locale/en.json'
import { ItemType, parseItem, RSSItem } from "./lib/rss"
TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US')

let processing: boolean = false
export const CheckFeeds = async (client: Client) => {
    if (processing) {
        console.log("CheckFeeds already running")
        return
    }

    console.log("CheckFeeds started...");
    processing = true
    // If no channel set, list out all the channels to help you pick
    // if (process.env.DISCORD_CHANNEL_ID === undefined) {
    //   console.log('Please set DISCORD_CHANNEL_ID');

    //   client.channels.cache.forEach(channel => {
    //     console.log(`DISCORD_CHANNEL_ID=${channel.id}`, channel);
    //   });
    //   return;
    // }

    let channel = null
    try {
        channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID) as TextChannel
    }
    catch (e) {
        console.error('Channel not found')
    }
    const users = await User.all(process.env.DISCORD_GUILD_ID)
    const delayBeforeCheck = 60 * 10 * 1000  // 10 minutes

    for await (let user of users) {
        const elapsed = new Date().getTime() - (user.lastCheckedAt || 0)

        if (elapsed <= delayBeforeCheck) {
            console.log(`Skipping ${user.username} - last updated`, elapsed / 1000, 'seconds ago')
            continue
        }

        await delay(500)
        const items = await user.getLatestDiaryEntries()

        user.lastCheckedAt = new Date().getTime()
        user.save()

        for await (const item of items) {
            // Format and post new items to the Discord channel
            await delay(1000)
            let message = `${item.creator} watched ${item.filmTitle} ${item.link}`
            console.log(item, message)

            const rewatched = item.rewatch ? 'rewatched' : 'watched'
            const desc = `[${item.creator}](${user.letterboxdUrl}) ${rewatched} ${timeAgo.format(item.watchedOn)}.`

            let review = item.type == ItemType.Review ? `\n\n> ${item.review.replace(/\n/mg,'\n\n').replace(/\n/mg,'\n> ')}` : ''

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

    processing = false
    console.log("CheckFeeds finished!");
}
