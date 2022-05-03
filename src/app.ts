import { Client, Permissions } from "discord.js";
import interactionCreate from "./listeners/interactionCreate";
import { CronJob } from "cron"
import { CheckFeeds } from "./check-feeds";
import 'dotenv/config'

console.log("Bot is starting...");
const permissions = Permissions.FLAGS.SEND_MESSAGES |
                    Permissions.FLAGS.SEND_MESSAGES_IN_THREADS |
                    Permissions.FLAGS.USE_EXTERNAL_EMOJIS |
                    Permissions.FLAGS.ADD_REACTIONS

console.log(`https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=${permissions}&scope=bot%20applications.commands`)

const client = new Client({
    intents: []
})

client.on("ready", async function() {
    if (!client.user || !client.application) {
        return;
    }

    // const commands = await client.application.commands.fetch()
    // console.log(commands.first().delete())

    console.log(`${client.user.username} is online`);

    const job = new CronJob('0 */1 * * * *', async () => {
        await CheckFeeds(client)
    })

    await CheckFeeds(client)
    job.start()
})

interactionCreate(client)

client.login(process.env.DISCORD_TOKEN);