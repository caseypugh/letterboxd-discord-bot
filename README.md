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

Make sure your have Node 16 installed. If you're using `nvm`...
```
nvm install 16
nvm use 16
```

Create an `.env` from the sample file and input your Discord credentials and local Redis server URL
```sh
cp .env.sample .env
```

Data for this bot is stored in Postgresql and uses Prisma as the ORM. Make sure you have a Postgres server running and set the `DATABASE_URL` in your env.

### Development
Install latest dependencies
```
yarn install
```

Run any pending database migrations

```
yarn db:migrate
```

And finally start the dev server
```sh
# Suports hot reloading
yarn dev
```
