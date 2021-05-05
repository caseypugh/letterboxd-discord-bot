require('dotenv').config();

const Config = require('./config');

const Discord = require('discord.js');
const client = new Discord.Client();
const CronJob = require('cron').CronJob;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  var job = new CronJob('* * * * * *', function() {
    console.log('You will see this message every second');
  }, null, true, 'America/Los_Angeles');
  job.start();
});

client.on('message', async message => {
  let output = "";
  let args = message.content.split(" ");
  let command = args.slice(0, 2).join(" ").toLowerCase();

  switch (command) {
    case 'letterboxd help':
      break;

    case 'letterboxd list':
      // Config.addUser(args[2]);
      await message.channel.send("Added!");
      break;

    case 'letterboxd add':
      Config.addUser(args[2]);
      await message.react("👍");
      // await message.channel.send("Added!");
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
