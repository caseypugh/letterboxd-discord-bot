import { Client, Guild, Permissions, InviteScope } from "discord.js";
import interactionCreate from "./listeners/interactionCreate";
import { CronJob } from "cron"
import { CheckFeeds } from "./check-feeds";
import 'dotenv/config'
import { DeployCommands } from "./tools/deploy-commands";
import { User } from "./data/user";

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

client.on("guildCreate", async (guild: Guild) => {
    console.log("=> Joined a new Guild!", guild.name, guild.id)

    // Create Slash commands upon joining the server
    await DeployCommands(guild.id)
})

client.on("guildDelete", async (guild: Guild) => {
    console.log("Left Guild", guild.name, guild.id)

    await User.clear(guild.id)

    console.log("All users deleted")
})

client.on("error", console.error)

client.on("ready", async () => {
    console.log('\n----------- Booting up -----------')
    if (!client.user || !client.application) {
        return;
    }

    const guilds = await client.guilds.fetch()
    guilds.forEach(async guild => {
        console.log(`Deploying commands to ${guild.name} (${guild.id}) ...`)
        DeployCommands(guild.id)
    })

    console.log(`${client.user.username} is online`);

    const job = new CronJob('0 */1 * * * *', async () => {
        await CheckFeeds(client)
    })

    await CheckFeeds(client)
    job.start()
})

interactionCreate(client)

client.login(process.env.DISCORD_TOKEN)