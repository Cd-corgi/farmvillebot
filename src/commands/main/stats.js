const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Discord = require('discord.js')
const { ownerId } = require('../../config/config.json')
module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("statistics")
        .setDescription("Check the Bot's Statistics"),
    async run(client, interaction) {
        const uptime = new EmbedBuilder()
            .setTitle(`${client.user.username} Statistics`)
            .setThumbnail(client.user.displayAvatarURL())
            .setColor("Blue")
            .addFields(
                { name: `🤖 Bot ID`, value: `\`${client.user.id}\``, inline: true },
                { name: `👑 Owner`, value: `<@${ownerId}>`, inline: true },
                { name: `👩‍🌾 Farmers Registered`, value: `\`${client.players.size}\` Farmers`, inline: true },
                { name: `🌐 Server Count`, value: `\`${client.guilds.cache.size}\` Servers`, inline: true }
            )
        await interaction.deferReply()
        interaction.followUp({ embeds: [uptime] })
    }
}