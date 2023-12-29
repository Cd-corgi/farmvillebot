const Discord = require('discord.js')
module.exports = async (client) => {
    setInterval(() => {
        client.user.setActivity(`${client.players.size} farmers!`, { type: Discord.ActivityType.Watching })
    }, 10000);
}