import * as Sentry from "@sentry/node"
import dotenv from "dotenv"

// `override: true` so .env wins over shell-exported vars during local dev.
// In production (Fly) there's no .env file, so platform-set env stays intact.
dotenv.config({ override: true })

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
