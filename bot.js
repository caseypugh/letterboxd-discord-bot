require('dotenv').config();

const Config = require('./config');

const Discord = require('discord.js');
const client = new Discord.Client();
const CronJob = require('cron').CronJob;

let Parser = require('rss-parser');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  var job = new CronJob('* */5 * * * *', function() {

    if (process.env.DISCORD_CHANNEL_ID === undefined) {
      console.log('Please set DISCORD_CHANNEL_ID');

      client.channels.cache.forEach(channel => {
        console.log(`DISCORD_CHANNEL_ID=${channel.id} - ${channel.name}`);
      });
      return;
    }

    const parser = new Parser();
    const users = Config.getUsers();

    users.forEach(user => {
      (async () => {

        const feed = await parser.parseURL(`https://letterboxd.com/${user['username']}/rss/`);

        feed.items.forEach(item => {
          const itemPubDate = Date.parse(item.pubDate);
          const userLastUpdate = Date.parse(user.updatedAt);
          
          if (itemPubDate > userLastUpdate) {
            let message = `${item.creator} watched ${item.title} ${item.link}`
            console.log(message, itemPubDate, userLastUpdate, itemPubDate >= userLastUpdate);
            const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
            console.log(channel);
            channel.send(message);
            Config.updateUser(user.username);
          }
        });
  
      })();
    }); 

  }, null, true, 'America/Los_Angeles');
  job.start();
});

client.on('message', async message => {
  let output = "";
  let args = message.content.split(" ");
  let command = args.slice(0, 2).join(" ").toLowerCase();

  switch (command) {
    case 'letterboxd help':
      let response = "```\n";
      response += "letterboxd list\n";
      response += "letterboxd add {username}\n";
      response += "letterboxd remove {username}\n";
      response += "```";
      await message.channel.send(response);
      break;

    case 'letterboxd list':
      await message.react("😂");
      await message.channel.send("This doesnt work dummy lol!");
      break;

    case 'letterboxd add':
      Config.addUser(args[2]);
      await message.react("👍");
      break;

    case 'letterboxd remove':
      Config.removeUser(args[2]);
      await message.react("👍");
      break;
  }

});

console.log(`Letterboxd bot starting...`);
console.log(`To add it to your server, visit:`);
console.log(`https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&scope=bot&permissions=378944`);
client.login(process.env.DISCORD_TOKEN);
