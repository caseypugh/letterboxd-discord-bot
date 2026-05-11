import { Client } from "discord.js"
import * as Sentry from "@sentry/node"

export default (client: Client): void => {
	client.on("error", (err) => {
		Sentry.captureException(err)
		console.error(err)
	})

	process.on("unhandledRejection", (reason) => {
		Sentry.captureException(reason)
		console.error("unhandledRejection", reason)
	})

	process.on("uncaughtException", (err) => {
		Sentry.captureException(err)
		console.error("uncaughtException", err)
	})
}
