const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmers = require('../../schema/farmer')
const moment = require('moment')
const { generateRaid } = require('../../utils/filters')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("raid-home")
        .setDescription("🔥 Try to raid someone's farm... you can get some money or their plot's seeds")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Choose your victim!")
                .setRequired(true)
        ),
    async run(client, interaction) {
        const user = interaction.options.getUser("user")
        let getFarmerAuthor = await farmers.findOne({ userId: interaction.user.id })
        if (!getFarmerAuthor) return interaction.reply({ embed: [new EmbedBuilder().setDescription(`You can't raid because you have not your home to be hidden!`)], ephemeral: true })
        if (getFarmerAuthor.cooldowns.some((x) => x.name === "Raid")) return interaction.reply({ content: `You already made a raid! Wait till the cooldown ends`, ephemeral: true })
        if (getFarmerAuthor.cooldowns.some((x) => x.name === "Protection")) return interaction.reply({ embeds: [new Discord.EmbedBuilder().setTitle(`🔒 Protection Detected!`).setDescription(`You can't raid meanwhile you are protected... Do not abuse of the effect!`)], ephemeral: true })
        if (user.id == interaction.user.id) return interaction.reply({ content: `Wait a minute! You can't raid yourself!`, ephemeral: true })
        let getFarmerTarget = await farmers.findOne({ userId: user.id })
        if (!getFarmerTarget) return interaction.reply({ embed: [new EmbedBuilder().setDescription(`${user.username} have not their house openned!`)], ephemeral: true })
        if (getFarmerTarget.cooldowns.some((x) => x.name === "Protection")) return interaction.reply({ embeds: [new Discord.EmbedBuilder().setTitle(`🔒 Protection Detected!`).setDescription(`The user ${user} has an active protection! You can't raid him/her/them`)], ephemeral: true })
        if (getFarmerAuthor.economy.money < 100) return interaction.reply({ content: `You have not the enough money to raid`, ephemeral: true })
        if (getFarmerTarget.economy.money < 10) return interaction.reply({ content: `Your victim have not enough money in his/her wallet!`, ephemeral: true })
        await generateRaid(client, interaction, getFarmerAuthor, getFarmerTarget).catch((error) => { })
        var curTime = Date.parse(moment(new Date()))
        curTime = moment(curTime).add(2700000, 'milliseconds')
        getFarmerAuthor.cooldowns.push({ name: `Raid`, emoji: `🔥`, time: Date.parse(moment(curTime)) })
        await farmers.findOneAndUpdate({ userId: interaction.user.id }, { cooldowns: getFarmerAuthor.cooldowns })
    }
}