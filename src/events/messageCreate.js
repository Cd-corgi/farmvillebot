const Discord = require('discord.js')
const farmer = require('../schema/farmer')
const { eventFallingStar } = require('../utils/functions')
module.exports = async (client, message) => {
    try {
        if (!message.guild) return
        if (message.author.bot || message.channel.type == Discord.ChannelType.DM || message.content.startsWith("<@") || message.content.includes("<@") || message.attachments.size > 0 || message.content.includes("@everyone")) return
        if (!client.players.get(message.author.id)) { let getPlayer = await farmer.findOne({ userId: message.author.id }); if (!getPlayer) return; client.players.set(getPlayer.userId, getPlayer) }
        let probabilidad = Math.floor(Math.random() * 100) / 100
        if (probabilidad <= 0.01) {
            let msg = await message.channel.send({ content: `${message.author}`, embeds: [new Discord.EmbedBuilder().setTitle(`✨ Wow, a Falling Star`).setDescription(`some kind of shooting star is passing through the sky.\n\nWhat will destiny bring you?`).setImage(`https://media.giphy.com/media/ipvydN5T6j7MjYZpI2/giphy.gif`)] })
            setTimeout(async () => {msg.delete().catch(() => { }); await eventFallingStar(message.author.id, client, message.channel.id)}, 5000)
        }
    } catch (error) {
        // console.log(error)
    }
}
