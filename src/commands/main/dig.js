const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')
const items = require('../../dictionary/digrewards.json')
const { ruleta, rangeNumber, givingItems, giveListItem } = require('../../utils/functions')
const moment = require('moment')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("dig")
        .setDescription("⛏ Make a hole and reach misterious items and crates (Shovel or Pickaxe Required)"),
    async run(client, interaction) {
        let farm = await farmer.findOne({ userId: interaction.user.id })
        if (!farm) return interaction.reply({ content: `You do not have any house openned to do this activity!`, ephemeral: true })
        const checkItems = farm.inventory.filter((x) => x.name == "Pickaxe")
        if (farm.cooldowns.some((v) => v.name == "Dig")) return interaction.reply({ content: `You already made a hole in the ground...`, ephemeral: true })
        if (checkItems.length < 1) return interaction.reply({ content: `You do not have a \`Pickaxe\` or \`Shovel\` to dig.`, ephemeral: true })
        farm.inventory.forEach(async (c, v) => {
            if (c.name == "Pickaxe") {
                c.amount--
                var ctime = Date.parse(moment(new Date()))
                farm.cooldowns.push({ name: "Dig", emoji: "🕳", time: Date.parse(moment(ctime).add(40, "minutes")) })
                await farmer.updateOne({ userId: interaction.user.id }, { cooldowns: farm.cooldowns })
                if (c.amount < 1) { farm.inventory = farm.inventory.filter((x) => x.amount > 0); await farmer.updateOne({ userId: interaction.user.id }, { inventory: farm.inventory }) }
                await interaction.reply({ embeds: [new EmbedBuilder().setTitle(`Keep out!`).setDescription(`${interaction.user} just started to make a hole!`).setThumbnail("https://media.giphy.com/media/XElbX0BRDLvfh3aCtb/giphy.gif")], })
                var getReward = ruleta(items)
                let itemList = []
                let prob = Math.floor(Math.random() * 100)
                if (prob <= 50) {
                    var getRange = rangeNumber(1, 250)
                    itemList.push({ item: "Money", type: "misc", emoji: "💵", amount: getRange })
                    itemList.push({ item: getReward.name, type: getReward.type, emoji: getReward.emoji, amount: getReward.amount })
                    setTimeout(async () => {
                        interaction.editReply({ content: `${interaction.user}`, embeds: [new EmbedBuilder().setTitle(`⛏ The Hole contains something!`).setDescription(`${itemList.map((x) => `${x.emoji} ${x.item} (${x.type}) x ${x.amount}`).join("\n")}`).setColor("Green").setThumbnail("https://media.giphy.com/media/AMPa3ktdNPoq56vqty/giphy.gif")] })
                        await giveListItem(itemList, farm)
                    }, 3000)
                } else {
                    setTimeout(async () => {
                        interaction.editReply({ content: `${interaction.user}`, embeds: [new EmbedBuilder().setTitle(`⛏ The Hole contains nothing...`).setDescription(`The hole has nothing to loot... Poor of you!`).setColor("Green").setThumbnail("https://media.giphy.com/media/cKPViLWvlFwpVDiQhS/giphy.gif")] })
                    }, 3000)
                }
            }
        })
    }
}