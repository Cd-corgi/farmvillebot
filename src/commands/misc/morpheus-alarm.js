const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Discord = require('discord.js')
const ma = require('../../schema/morpheus')

module.exports = {
    permissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("morpheus-signal")
        .setDescription("Enable/Disable the alarms that Morpheus makes to give something!")
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("Add the channel that you can set the alarm channel")
        ),
    async run(client, interaction) {
        const chan = interaction.options.getChannel("channel")
        let getGuild = await ma.findOne({ guildId: interaction.guild.id })
        if (!chan) {
            if (!getGuild) return interaction.reply({ content: `This guild has not even registered to make this action!`, ephemeral: true })
            await ma.findOneAndDelete({ guildId: interaction.guild.id })
            return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`✅ Alarms have been disabled!`).setDescription(`You disabled the alarm notifications!`).setColor("Green")], ephemeral: true })
        } else {
            if (!getGuild) {
                new ma({ guildId: interaction.guild.id, channelId: chan.id }).save()
                return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`✅ Channel registered!`).setDescription(`Morpheus can send to this channel the alarms!`).setColor("Green")], ephemeral: true })
            } else {
                return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`⚠ Channel already registered!`).setDescription(`You can't set more channels! Disable it first to set other channel!`)], ephemeral: true })
            }
        }
    }
}