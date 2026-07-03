<img src="public/discord-letterboxd-promo-wide.png" alt="Letterboxd Discord Bot Promo" />

## Overview
This a simple bot that posts new diary entries from your Letterboxd friends to your preferred Discord channel.

## Add to your Discord server!
Use this handy link to add the bot.

[![Add to Discord](public/add-to-discord.svg)](https://discord.com/api/oauth2/authorize?client_id=839325760501448704&permissions=2112&scope=bot%20applications.commands)

Or follow the instructions below on how to host the bot yourself.

### Slash Commands

- `/add` - Subscribes to a Letterboxd user's new diary entries
- `/remove` - Unsubscribe a Letterboxd user
- `/list` - See a list of all the current users
- `/channel` - Update which channel to post to. (Defaults to the system channel)
- `/snooze` - Mute a user's posts for N hours (max 720); pass `0` to unsnooze


### How it works
Right now all this bot does is scrape RSS feeds to find the latest entry. I'm hoping to get access to Letterboxd API to introduce new functionality.

> [!NOTE]
> If you want more than just a diary poster, check out [**Filmlinkd**](https://jimlind.github.io/filmlinkd/) — a more feature-rich Letterboxd Discord bot.

## How to run the bot yourself

### Initial setup
Clone this repo to your computer.

```sh
git clone git@github.com:caseypugh/letterboxd-discord-bot.git
cd letterboxd-discord-bot
```

Make sure you have Node 24 installed. If you're using `nvm`...
```
nvm install 24
nvm use 24
```

Create an `.env` from the sample file and fill in your Discord credentials.
```sh
cp .env.sample .env
```

Data is stored in SQLite via Prisma — no database server needed. Locally the database is just a file at `prisma/dev.db`, created automatically the first time you run migrations. In production the bot talks to a hosted [Turso](https://turso.tech) database over libSQL.

### Development

Install dependencies once:
```
pnpm install
```

Then bring up the whole dev environment with one command:
```sh
pnpm up
```

This applies any pending migrations to the local SQLite file and runs the bot with hot reload.

If you'd rather run the pieces separately:
```sh
pnpm db:migrate        # apply migrations (creates prisma/dev.db)
pnpm dev               # run the bot
```

## Deployment

The bot is a long-running worker (Discord gateway + a 1-minute cron loop). It needs an always-on host plus a database. A `Dockerfile` is included so you can deploy to any container platform.

### Recommended: Fly.io + Turso (~$0/mo for the database)

1. **Create a database on [Turso](https://turso.tech)** — the free plan is far more than this bot needs:
   ```sh
   turso db create letterboxd-bot
   turso db show letterboxd-bot --url   # -> libsql://letterboxd-bot-<org>.turso.io
   turso db tokens create letterboxd-bot
   ```
2. **Install [`flyctl`](https://fly.io/docs/flyctl/install/)** and run `fly launch --no-deploy --copy-config` from the repo root. If the app name `letterboxd-discord-bot` is taken, Fly will prompt you for a different one — update `fly.toml` to match.
3. **Set secrets:**
   ```sh
   fly secrets set \
     DISCORD_CLIENT_ID=... \
     DISCORD_TOKEN=... \
     TURSO_DATABASE_URL='libsql://letterboxd-bot-<org>.turso.io' \
     TURSO_AUTH_TOKEN='...'
   ```
4. **Deploy:** `fly deploy` — schema migrations are applied automatically on startup.

### Migrating data from an existing Postgres database

If you're moving off a previous Postgres deployment (e.g. Neon), stop the bot, apply the schema to Turso, then copy the rows with the included one-off script:

```sh
TURSO_DATABASE_URL='libsql://...' TURSO_AUTH_TOKEN='...' pnpm db:deploy
POSTGRES_URL='postgresql://...' \
  TURSO_DATABASE_URL='libsql://...' TURSO_AUTH_TOKEN='...' \
  NODE_PATH=./ pnpm exec ts-node src/tools/migrate-data.ts
```

### Auto-deploy via GitHub Actions

A workflow at `.github/workflows/deploy.yml` deploys to Fly on every push to `main`. To use it on your fork:

1. Run `fly tokens create deploy` and copy the token.
2. Add it to your repo's secrets as `FLY_API_TOKEN` (Settings → Secrets and variables → Actions).
3. Push to `main`.

### Other platforms

The included `Dockerfile` works on any container host — Railway, Render, DigitalOcean, a VPS, etc. The bot needs four env vars: `DISCORD_CLIENT_ID`, `DISCORD_TOKEN`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`. (Alternatively, on a host with a persistent volume you can skip Turso entirely and set `DATABASE_URL=file:/path/to/bot.db`.)
