import df from "data/df.json"
import { User } from "src/data/user"
import 'dotenv/config'

(async () => {
    for await (const importUser of df.users) {
        const user = new User(process.env.DISCORD_GUILD_ID)
        user.username = importUser.username
        user.createdAt = Date.parse(importUser.createdAt)
        user.updatedAt = Date.parse(importUser.updatedAt)
        user.lastCheckedAt = null
        await user.save()

        console.log("Adding " + user.username)
    }
})()
