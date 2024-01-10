const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')
const { fishes } = require('../../config/items.json')
const moment = require('moment')
const { rangeNumber, giveListItem } = require('../../utils/functions')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("fish")
        .setDescription("🎣 Use your fishing rod to get some fishes!"),
    async run(client, interaction) {
        let farm = await farmer.findOne({ userId: interaction.user.id })
        if (!farm) return interaction.reply({ content: `You do not have a house openned yet!`, ephemeral: true })
        if (!farm.inventory.some((x) => x.name == "Fishing Rod")) return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`You do not have any 🎣 \`Fishing Rod\` to start fishing in the sea`)], ephemeral: true })
        if (farm.cooldowns.some((x) => x.name == "Fishing")) return interaction.reply({ content: `You already did this action, wait till it ends!`, ephemeral: true })
        var curDate = Date.parse(moment(new Date()))
        curDate = Date.parse(moment(curDate).add(25, "minutes"))
        farm.cooldowns.push({ name: "Fishing", emoji: "🎣", time: curDate })
        farm.inventory[farm.inventory.map((c) => c.name).indexOf("Fishing Rod")].amount--
        farm.inventory = farm.inventory.filter((x) => x.amount > 0)
        await farmer.findOneAndUpdate({ userId: interaction.user.id }, { inventory: farm.inventory })
        let msg = await interaction.reply({ embeds: [new EmbedBuilder().setTitle(`🎣 A phishing time just started!`).setDescription(`${interaction.user} just used the bot to navigate!`).setImage("https://media.giphy.com/media/BLG7sWHD0RHFK/giphy.gif")] })
        setTimeout(async () => {
            let getRandom = Math.floor(Math.random() * 100)
            if (getRandom <= 50) {
                interaction.editReply({ embeds: [new EmbedBuilder().setTitle(`🎣 Fishing Finished!`).setDescription(`Oh~ your fishing rod just failed to catch the objective! don't be sad. We can do it again!`).setColor("Red")] })
            } else {
                var getMaxFish = rangeNumber(1, 3)
                var getMaxFishAmount = rangeNumber(1, 5)
                var ff = []
                for (let i = 0; i < getMaxFish; i++) {
                    var getFish = fishes[Math.floor(Math.random() * (fishes.length - 1))]
                    if (ff.some((x) => x.item == getFish.name)) {
                        var getFishEx = ff.map((v) => v.item).indexOf(getFish.name)
                        ff[getFishEx].amount += getMaxFishAmount
                    } else {
                        ff.push({ item: getFish.name, type: getFish.type, emoji: getFish.emoji, amount: getMaxFishAmount })
                    }
                }
                interaction.editReply({ content: `${interaction.user}`, embeds: [new EmbedBuilder().setTitle(`🎣 Fishing Finished!`).setThumbnail("https://media.giphy.com/media/YDL8WPvV0Ob3ZmtAmF/giphy.gif").setDescription(`Wow! ${interaction.user} just got luck to get the following fishes!`).addFields({ name: `🐠 Fishes`, value: ff.map((x, i) => `\`${i + 1}\` ${x.emoji} **${x.item}** x ${x.amount}`).join("\n") }).setColor("Green")] })
                await giveListItem(ff, farm)
            }
            await farmer.findOneAndUpdate({ userId: interaction.user.id }, { cooldowns: farm.cooldowns })
        }, 4000)
    }
}