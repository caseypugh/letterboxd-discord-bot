<center>
<h2>Letterboxd Discord Bot</h2>
See what your friends are watching.
</center>

## Overview
This a simple bot that posts new diary entries from your Letterboxd friends to your preferred Discord channel.

## Add to your Discord server!
Use this handy link to add the bot. Or follow the instructions below on how to run it yourself.
- [**Add to Server**](https://discord.com/api/oauth2/authorize?client_id=839325760501448704&permissions=2112&scope=bot%20applications.commands)

## Commands

- `/add` - Subscribes to a Letterboxd user's new diary entries
- `/remove` - Unsubscribe a Letterboxd user
- `/list` - See a list of all the current users
- `/channel` - Update which channel to post to. (Defaults to the system channel)

## How it works
Right now all this bot does is scrape RSS feeds. I'm hoping to get access to Letterboxd API to introduce new functionality.

## How to run the bot yourself

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

Install dependencies

```
yarn install
```

And finally start the dev server
```sh
# Suports hot reloading
yarn dev
```
