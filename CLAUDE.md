# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` — run the bot locally with hot reload (nodemon + ts-node, watches `src/**/*.ts`).
- `pnpm start` — production entry; runs `pnpm db:deploy` (custom migration runner), `prisma generate`, then `ts-node src/app.ts`. Used as the container `CMD` in the included `Dockerfile`.
- `pnpm db:migrate` — `prisma migrate dev` against the local SQLite file in `DATABASE_URL`.
- `pnpm db:deploy` — `src/tools/migrate.ts`: applies pending `prisma/migrations/*/migration.sql` over libSQL, since `prisma migrate deploy` cannot connect to Turso's `libsql://` protocol. Tracks applied migrations in a `_migrations` table and also honors `_prisma_migrations` entries so a `prisma migrate dev`-managed local DB is never double-migrated.
- `pnpm db:generate` — regenerate the Prisma client (run after editing `prisma/schema.prisma`).
- `pnpm test` — runs `ts-node test.ts`. The file does not exist in the repo; there is no real test suite.

Required env vars (`.env`, see `.env.sample`): `DISCORD_CLIENT_ID`, `DISCORD_TOKEN`, and either `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (production, takes precedence) or `DATABASE_URL` as a `file:` SQLite path (local dev, default `file:./dev.db` relative to `prisma/`). `ENV=dev` is read in `lib/deploy-commands.ts` but currently no-op.

Node 24 (see `engines` in `package.json` and `.nvmrc`).

**Deployment:** the repo ships a `Dockerfile` and a `fly.toml` configured as a worker (no HTTP service). `.github/workflows/deploy.yml` deploys to Fly on push to `main` via the `FLY_API_TOKEN` secret. The database is SQLite hosted on Turso; set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` via `fly secrets set`. `src/tools/migrate-data.ts` is a one-off Neon→Turso row copier (see README).

## Architecture

Single-process Discord bot. There is no HTTP server; the bot is a long-running worker that owns both the Discord gateway connection and a cron loop that polls Letterboxd RSS feeds.

**Entry point — `src/app.ts`:**
1. Creates a `discord.js` v13 `Client` with only the `GUILDS` intent (no message content / member intents).
2. On `ready`, calls `DeployCommandsGlobal()` once — slash commands are registered globally, so the bot's profile shows them as Commands chips and `</command:id>` mentions resolve anywhere. First publish can take up to ~1hr to propagate; updates are usually fast.
3. Starts a `cron` job `0 */1 * * * *` (every minute, plus `runOnInit: true`) that calls `CheckFeeds(client)`.
4. Wires listeners: `interactionCreate`, `guildCreate`, `guildDelete`, `error`.

**Feed loop — `src/check-feeds.ts`:**
- Module-level `processing` boolean prevents overlapping cron ticks. If a tick runs long, the next minute's tick is skipped, not queued.
- For each guild in cache: ensures a `GuildConfig` row exists, picks the target channel (`guildConfig.channelId` if set, else `guild.systemChannel`), then iterates `Users(prisma).allStale(guild.id)` — users whose `lastCheckedAt` is older than 10 minutes (`delayBeforeCheck` in `models/user.ts`).
- For each stale user: fetches RSS via `getLatestDiaryEntries`, immediately stamps `lastCheckedAt = now`, then for each new item builds a `MessageEmbed` and posts to the channel. There are deliberate `delay(500)`/`delay(1000)` pauses to be gentle on Letterboxd and Discord rate limits.
- "New" is determined in `getLatestDiaryEntries`: items with `pubDate >= user.lastCheckedAt`. **First-time users have `lastCheckedAt = null`**, which falls back to `99999999999999`, so the very first poll for a user posts nothing — only entries published after the first check are surfaced.

**Slash commands — `src/commands/`:**
- `command.ts` exports the `Command` interface (`{ command: SlashCommandBuilder, run }`) and the `Commands` array. Adding a command requires a new file plus an entry in this array; `interactionCreate.ts` dispatches by `commandName`.
- `add` — validates the username via `isValidUser` (HEAD on the RSS URL), creates a `User` row, and posts a public confirmation in the configured channel.
- `remove` / `list` / `channel` — direct Prisma reads/writes against `User` and `GuildConfig`.

**Data — `prisma/schema.prisma`:**
- Provider is `sqlite`; the client connects through the libSQL driver adapter (`@prisma/adapter-libsql`) built in `src/lib/prisma.ts`. `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` win over `DATABASE_URL`. Relative `file:` URLs are anchored to the `prisma/` directory there so the CLI and runtime open the same file.
- `User`: `(username, guildId)` is unique — the same Letterboxd handle can be subscribed in multiple guilds (separate rows). `lastCheckedAt` drives staleness.
- `GuildConfig`: one per guild. `channelId` is nullable; `null` means fall back to the guild's system channel.
- `guildDelete` listener hard-deletes both `User` and `GuildConfig` rows for the guild — there is no soft delete or retention.

**RSS parsing — `src/lib/rss.ts`:**
- `parseItem` mutates the input rather than constructing a fresh object; the function signature lies about types (`item: any` is cast to `RSSItem`). Touch with care.
- Only `ItemType.Review` and `ItemType.Watch` items are kept; lists are filtered out in `getLatestDiaryEntries`.
- Spoiler detection is a substring match on `title` for `"spoiler"`; spoiler reviews get wrapped in Discord `||...||` markers in `check-feeds.ts`.
- Embed description has a 4096-char cap; long reviews are truncated with a `[...more](link)` suffix.

**Path aliases:** `tsconfig.json` sets `baseUrl: "./"` and `package.json` scripts set `NODE_PATH=./`, so imports like `src/lib/prisma` and `src/commands/...` resolve from the repo root. Both styles (`./relative` and `src/...`) appear in the codebase.
