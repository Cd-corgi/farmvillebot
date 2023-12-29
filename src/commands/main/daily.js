const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')
const moment = require('moment')
const { getItems } = require('../../utils/filters')
const { giveDailyItems } = require('../../utils/functions')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("daily")
        .setDescription("💵 Claim your daily income!"),
    async run(client, interaction) {
        let getFarmer = await farmer.findOne({ userId: interaction.user.id })
        if (!getFarmer) return interaction.reply({ content: `You do not have a house opened yet...`, ephemeral: true })
        if (getFarmer.cooldowns.some((v) => v.name == "Daily")) return interaction.reply({ embeds: [new EmbedBuilder().setTitle("⌛ Daily Cooldown").setDescription(`You already got your Daily income!`)], ephemeral: true })
        var items = getItems()
        await interaction.deferReply()
        interaction.followUp({ embeds: [new EmbedBuilder().setTitle(`📦 Daily Box`).setDescription(items.map((x, i) => `> **${i + 1}** ${x.emoji} \`${x.name}\` ${x.type == null ? `+ \`${x.amount}\` -> 💵 \`${getFarmer.economy.money}\`` : `**${x.type}** x \`${x.amount}\``}`).join('\n').substring(0, 2048)).setColor("Random").setThumbnail(interaction.user.displayAvatarURL()).setFooter({ text: `Every 24 hours will get always money and some Seeds!` })] }).then(() => setTimeout(() => interaction.deleteReply(), 7500))
        setTimeout(async () => {
            await giveDailyItems(getFarmer, items)
        }, 2000)
    }
}