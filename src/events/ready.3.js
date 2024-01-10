const Discord = require('discord.js')
module.exports = async (client) => {
    let i = 0
    setInterval(() => {
        let status = [`${client.players.size} Farmers`, `${client.guilds.cache.size} Servers!`, `${client.users.cache.size} Users!`]
        if (i >= (status.length - 1)) { i = 0 } else { i++ }
        client.user.setActivity(`${status[i]}`, { type: Discord.ActivityType.Watching })
    }, 25000);
}