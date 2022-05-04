import { Client, Permissions, InviteScope } from "discord.js";
import interactionCreate from "./listeners/interactionCreate";
import { CronJob } from "cron"
import { CheckFeeds } from "./check-feeds";
import 'dotenv/config'
import { DeployCommands } from "./lib/deploy-commands";
import guildCreate from "./listeners/guildCreate";
import guildDelete from "./listeners/guildDelete";
import error from "./listeners/error";

console.log("Letterboxd is starting...");
const permissions = Permissions.FLAGS.SEND_MESSAGES |
                    // Permissions.FLAGS.SEND_MESSAGES_IN_THREADS |
                    // Permissions.FLAGS.USE_EXTERNAL_EMOJIS |
                    Permissions.FLAGS.ADD_REACTIONS

const scopes: InviteScope[] = ["bot", "applications.commands"]

console.log(`Add bot to server => https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=${permissions}&scope=${scopes.join('%20')}`)

const client = new Client({
    intents: ["GUILDS", "GUILD_EMOJIS_AND_STICKERS"]
})

client.on("ready", async () => {
    console.log(`\n----------- ${client.user.username} is online -----------`)

    if (!client.user || !client.application) {
        return;
    }

    // Deploy the latest commands to every guild
    const guilds = await client.guilds.fetch()
    guilds.forEach(async guild => {
        DeployCommands(guild.id)
    })

    // Run the feed check every minute
    const job = new CronJob({
        cronTime: '0 */1 * * * *',
        onTick: async () => {
            console.log("\n~~~~~~~~~ CronJob starting ~~~~~~~~~")
            await CheckFeeds(client)
            console.log("~~~~~~~~~ CronJob finished ~~~~~~~~~")
        },
        runOnInit: true
    })
    job.start()
})

interactionCreate(client)
guildCreate(client)
guildDelete(client)
error(client)

client.login(process.env.DISCORD_TOKEN)