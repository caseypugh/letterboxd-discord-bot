require('dotenv').config();

const Config = require('./config');

const Discord = require('discord.js');
const client = new Discord.Client();
const CronJob = require('cron').CronJob;

let Parser = require('rss-parser');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Poll feeds every 5 minutes 
  var job = new CronJob('* */5 * * * *', function() {

    // If no channel set, list out all the channels to help you pick
    if (process.env.DISCORD_CHANNEL_ID === undefined) {
      console.log('Please set DISCORD_CHANNEL_ID');

      client.channels.cache.forEach(channel => {
        console.log(`DISCORD_CHANNEL_ID=${channel.id} - ${channel.name}`);
      });
      return;
    }

    const parser = new Parser();
    const users = Config.getUsers();

    // Loop through da users
    let delay = 0;
    users.forEach(user => {
      (async () => {
        // Stagger the calls
        await new Promise(r => setTimeout(r, delay));
        
        console.log(`Fetching RSS feed for ${user.username} - https://letterboxd.com/${user.username}/rss/`);
        const feed = await parser.parseURL(`https://letterboxd.com/${user.username}/rss/`);

        feed.items.forEach(item => {
          const itemPubDate = Date.parse(item.pubDate);
          const userLastUpdate = Date.parse(user.updatedAt);
          
          // Only post if it's a new item
          if (itemPubDate >= userLastUpdate) {
            let message = `${item.creator} watched ${item.title} ${item.link}`
            const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);

            console.log(message, itemPubDate, userLastUpdate, itemPubDate >= userLastUpdate);

            channel.send(message);

            // Update the user updatedAt date
            Config.updateUser(user.username);
          }
        });
      })();

      delay += 500;
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
      output = "```\n";
      output += "letterboxd list\n";
      output += "letterboxd add {username}\n";
      output += "letterboxd remove {username}\n";
      output += "```";
      await message.channel.send(output);
      break;

    case 'letterboxd list':
      output = "```\n";
      Config.getUsers().forEach(u => {
        output += `${u.username}\n`;
      });
      output += '```';
      await message.channel.send(output);
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
