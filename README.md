<img src="public/discord-letterboxd-promo-wide.png" alt="Letterboxd Discord Bot Promo" />

## Overview
This a simple bot that posts new diary entries from your Letterboxd friends to your preferred Discord channel.

## Add to your Discord server!
Use this handy link to add the bot. 

_NOTE: Add at your own risk! I have no intentions of maintaining this hosted bot and could likely shut down in the near future. If you'd like to use something more reliable check out the [Filmlinkd](https://jimlind.github.io/filmlinkd/) bot._

- [**Add to Server**](https://discord.com/api/oauth2/authorize?client_id=839325760501448704&permissions=2112&scope=bot%20applications.commands)

Or follow the instructions below on how to host the bot yourself.

### Slash Commands

- `/add` - Subscribes to a Letterboxd user's new diary entries
- `/remove` - Unsubscribe a Letterboxd user
- `/list` - See a list of all the current users
- `/channel` - Update which channel to post to. (Defaults to the system channel)


### How it works
Right now all this bot does is scrape RSS feeds to find the latest entry. I'm hoping to get access to Letterboxd API to introduce new functionality. If you are looking for more features, check out [Filmlinkd](https://jimlind.github.io/filmlinkd/). 

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

Data is stored in Postgres via Prisma. The repo includes a `docker-compose.yml` for local development — start it with:

```sh
docker compose up -d
```

This runs Postgres 17 on `localhost:5432` with the credentials already wired into `.env.sample`. To stop it: `docker compose down`. Data persists in a Docker volume between restarts.

If you'd rather use a Postgres install of your own, just update `DATABASE_URL` in `.env`.

### Development

Install dependencies once:
```
pnpm install
```

Then bring up the whole dev environment with one command:
```sh
pnpm up
```

This starts the local Postgres container (waits for it to be healthy), applies any pending migrations, and runs the bot with hot reload.

If you'd rather run the pieces separately:
```sh
docker compose up -d   # start Postgres
pnpm db:migrate        # apply migrations
pnpm dev               # run the bot
```

## Deployment

The bot is a long-running worker (Discord gateway + a 1-minute cron loop). It needs an always-on host plus a Postgres database. A `Dockerfile` is included so you can deploy to any container platform.

### Recommended: Fly.io + Neon (~$0–5/mo)

1. **Create a Postgres database on [Neon](https://neon.tech)** and copy the connection string.
2. **Install [`flyctl`](https://fly.io/docs/flyctl/install/)** and run `fly launch --no-deploy --copy-config` from the repo root. If the app name `letterboxd-discord-bot` is taken, Fly will prompt you for a different one — update `fly.toml` to match.
3. **Set secrets:**
   ```sh
   fly secrets set \
     DISCORD_CLIENT_ID=... \
     DISCORD_TOKEN=... \
     DATABASE_URL='postgresql://...neon.tech/...?sslmode=require'
   ```
4. **Deploy:** `fly deploy`

### Auto-deploy via GitHub Actions

A workflow at `.github/workflows/deploy.yml` deploys to Fly on every push to `main`. To use it on your fork:

1. Run `fly tokens create deploy` and copy the token.
2. Add it to your repo's secrets as `FLY_API_TOKEN` (Settings → Secrets and variables → Actions).
3. Push to `main`.

### Other platforms

The included `Dockerfile` works on any container host — Railway, Render, DigitalOcean, a VPS, etc. The bot needs three env vars: `DISCORD_CLIENT_ID`, `DISCORD_TOKEN`, `DATABASE_URL` (Postgres).
