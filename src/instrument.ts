import * as Sentry from "@sentry/node"
import "dotenv/config"

const dsn = process.env.SENTRY_DSN

if (dsn) {
	Sentry.init({
		dsn,
		environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "production",
		release: process.env.SENTRY_RELEASE,
		tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
	})
	console.log("Sentry enabled")
}

export const sentryEnabled = Boolean(dsn)
