const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')
const jobs = require('../../dictionary/jobs.json')
const { rangeNumber } = require('../../utils/functions')
const moment = require('moment')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("work")
        .setDescription("💼 Make some middle time work to get a bit of money!"),
    async run(client, interaction) {
        let getFarmer = await farmer.findOne({ userId: interaction.user.id })
        if (!getFarmer) return interaction.reply({ content: `You do not have your home openned yet!`, ephemeral: true })
        if(getFarmer.cooldowns.some((v) => v.name == "Work")) return interaction.reply({ content: `⚠ \`You already worked... Wait till the cooldown ends!\``, ephemeral: true })
        let curDate = Date.parse(moment(new Date()))
        curDate = moment(curDate).add(45, 'minutes')
        var newData = Date.parse(curDate)
        getFarmer.cooldowns.push({ name: "Work", emoji: "💼", time: newData })
        await interaction.reply({ content: `You are working...` })
        setTimeout(async () => {
            let getValue = jobs[Math.floor(Math.random() * jobs.length)]
            let getMoney = rangeNumber(getValue.reward.min, getValue.reward.max)
            interaction.editReply({ embeds: [new EmbedBuilder().setTitle(`💼 Work Finished`).setDescription(`**You worked as ${getValue.employ}...**\n\n${getValue.workingDialog}. You got 💵 \`${getMoney}\``).setColor("Green")], content: "", }).then(() => setTimeout(() => interaction.deleteReply(), 5000)).catch((error) => {})
            getFarmer.economy.money += getMoney
            await farmer.findOneAndUpdate({ userId: interaction.user.id }, { economy: getFarmer.economy, cooldowns: getFarmer.cooldowns })
        }, 3000)
    }
}