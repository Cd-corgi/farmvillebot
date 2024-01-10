const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')
const itemEffects = require('../../dictionary/usage.json')
const moment = require('moment')
const { generateCrateLoot, givingItems, giveListItem } = require('../../utils/functions')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("use")
        .setDescription("📦 Use an item from your inventory!")
        .addStringOption(option =>
            option
                .setName("item")
                .setDescription("Provide the name of the item to use!")
                .setRequired(true)
        ),
    async run(client, interaction) {
        const getItem = interaction.options.getString("item")
        let getUser = await farmer.findOne({ userId: interaction.user.id })
        if (!getUser) return interaction.reply({ content: `⚠ You do not have your house open to use this command!`, ephemeral: true })
        if (!getUser.inventory.some((v) => v.name.toLowerCase() == getItem.toLowerCase())) return interaction.reply({ content: `You do not have that item or check if the item name is the correct`, ephemeral: true })
        let getItemInfo = getUser.inventory[getUser.inventory.map((v) => v.name.toLowerCase()).indexOf(getItem.toLowerCase())]
        if (!itemEffects.items.some((x) => x.itemName.toLowerCase() == getItemInfo.name.toLowerCase())) return interaction.reply({ content: `This item has not any use.`, ephemeral: true })
        var getEffectInfo = itemEffects.effect[itemEffects.effect.map((c) => c.itemName).indexOf(getItemInfo.name)]
        if (getItemInfo.type == "misc" || getItemInfo.type == "tool") { if (getUser.cooldowns.some((v) => v.name == getEffectInfo.effect)) return interaction.reply({ content: `You already have an effect related with this item!`, ephemeral: true }) }
        await interaction.reply({ embeds: [new Discord.EmbedBuilder().setDescription(`Using ${getItemInfo.emoji} ${getItemInfo.name} ...`)] })
        getItemInfo.amount--
        if ((getItemInfo.amount - 1) < 1) {
            getUser.inventory = getUser.inventory.filter((x) => x.amount > 0)
        } else { getItemInfo.amount -= 1 }
        setTimeout(async () => {
            var miscData = itemEffects.items.map((v) => v.itemName).indexOf(getItemInfo.name)
            if (itemEffects.items[miscData].effects !== undefined) {
                let getCurTime = Date.parse(moment(new Date()))
                if (getEffectInfo.effect == "Time Aceleration" || getEffectInfo.effect == "Time Reduction") {
                    getCurTime = moment(getCurTime).add(itemEffects.items[miscData].effects.duration, 'ms')
                    getUser.cooldowns.push({ name: `${getEffectInfo.effect}`, emoji: "⏩", time: getCurTime, item: getItemInfo.name })
                } else if (getEffectInfo.effect == "Fertilized") {
                    getCurTime = moment(getCurTime).add(itemEffects.items[miscData].effects.duration, 'ms')
                    getUser.cooldowns.push({ name: `${getEffectInfo.effect}`, emoji: "🌱", time: getCurTime, item: getItemInfo.name })
                } else if (getEffectInfo.effect == "Protection") {
                    getCurTime = moment(getCurTime).add(itemEffects.items[miscData].effects.duration, 'ms')
                    getUser.cooldowns.push({ name: `${getEffectInfo.effect}`, emoji: "🛡", time: getCurTime, item: getItemInfo.name })
                }
                await farmer.findOneAndUpdate({ userId: interaction.user.id }, { inventory: getUser.inventory, cooldowns: getUser.cooldowns })
                interaction.editReply({ embeds: [new EmbedBuilder().setTitle(`${interaction.user.username} just used ${getItemInfo.emoji} ${getItemInfo.name}!`).setDescription(`${itemEffects.items[miscData].usageDialoge}`).setColor("Green")] }).then(() => setTimeout(() => interaction.deleteReply(), 5000)).catch((error) => { })
            } else {
                interaction.editReply({ embeds: [new EmbedBuilder().setTitle(`${interaction.user.username} just used ${getItemInfo.emoji} ${getItemInfo.name}!`).setDescription(`${itemEffects.items[miscData].usageDialoge}`).setColor("Green")] }).then(() => setTimeout(() => interaction.deleteReply(), 5000)).catch((error) => { })
                if (getItemInfo.type == "crate") {
                    let getList = await generateCrateLoot(getItemInfo)
                    await giveListItem(getList, getUser)
                    await interaction.followUp({
                        content: `${interaction.user}`,
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`${getItemInfo.emoji} ${getItemInfo.name} Obtained Loot`)
                                .setThumbnail("https://media.giphy.com/media/kBY2dMV77qFRMKgNm6/giphy.gif")
                                .setDescription(
                                    getList.map((x, i) => `**${i + 1}** ${x.emoji} \`${x.item}\` (${x.type}) x ${x.amount}`).join("\n").substring(0, 2048))
                        ]
                    })
                }
            }
        }, 5000)
    }
}