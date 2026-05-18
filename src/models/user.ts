/**
 * WIP class... ideally all API logic could be thrown into here which the API and SSG both leverage
 */
import { PrismaClient, User } from "@prisma/client"

export function Users(prisma: PrismaClient) {
	return Object.assign(prisma, {
		async all(guildId: string) {
			return await prisma.user.findMany({ where: { guildId } })
		},

		async allStale(guildId: string): Promise<User[]> {
			if (!guildId) {
				console.error("No guildId passed in")
			}

			const delayBeforeCheck = 60 * 10 * 1000 // 10 minutes
			const now = new Date().getTime()
			const users = await this.all(guildId)

			return users.filter((user) => {
				if (user.snoozedUntil && user.snoozedUntil.getTime() > now) return false
				const elapsed = now - (user.lastCheckedAt?.getTime() || 0)
				return elapsed > delayBeforeCheck
			})
		},
	})
}
