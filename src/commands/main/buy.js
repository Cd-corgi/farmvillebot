const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')
const shop = require('../../schema/gardenShop')
const checkItem = require('../../config/items.json')
const moment = require('moment')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("buy")
        .setDescription("🛒 Buy items from the Shop.")
        .addStringOption(option =>
            option
                .setName("item")
                .setDescription("Provide the item name to make the purchase")
                .setRequired(true)
        ),
    async run(client, interaction) {
        const items = interaction.options.getString("item")
        let farm = await farmer.findOne({ userId: interaction.user.id })
        if (!farm) return interaction.reply({ content: `You do not have your house open`, ephemeral: true })
        let checkItem = await shop.find()
        if (!checkItem.some((v) => v.name.toLowerCase() == items.toLowerCase())) return interaction.reply({ content: `The called item is not existing.`, ephemeral: true })
        const controlRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("redo1").setLabel(`< -1`).setStyle(Discord.ButtonStyle.Secondary)).addComponents(new ButtonBuilder().setCustomId("buy").setLabel("Buy").setEmoji("📦").setStyle(Discord.ButtonStyle.Success)).addComponents(new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setEmoji("❎").setStyle(Discord.ButtonStyle.Danger)).addComponents(new ButtonBuilder().setCustomId("give1").setLabel(`+1 >`).setStyle(Discord.ButtonStyle.Secondary))
        var itemInfo = checkItem.filter((v) => v.name.toLowerCase() == items.toLowerCase())
        let amount = 1
        let embed = new EmbedBuilder().setTitle(`🛒 Purchasing Process`).addFields({ name: `📦 Item`, value: `${itemInfo[0].emoji} \`${itemInfo[0].name}\``, inline: true }, { name: `🛍 Amount`, value: `${amount}`, inline: true }, { name: `💵 Price`, value: `\`${Math.floor(itemInfo[0].price * amount)}\``, inline: true }, { name: `🏷 Type`, value: `\`${itemInfo[0].type}\``, inline: true }, { name: `🏷 Description`, value: `\`\`\`${itemInfo[0].description}\`\`\`` }).setColor("Orange")
        if (amount == 1) controlRow.components[0].setDisabled(true)
        if (itemInfo[0].name == "Sodium River") { controlRow.components[3].setDisabled(true) }
        if (Math.floor((itemInfo[0].price) * (amount + 1)) >= farm.economy.money) controlRow.components[3].setDisabled(true)
        let msg = await interaction.reply({ embeds: [embed], components: [controlRow], ephemeral: true })
        const collector = interaction.channel.createMessageComponentCollector({ time: 900000000, idle: 7000, componentType: Discord.ComponentType.Button })
        collector.on("collect", async i => {
            await i?.deferUpdate()
            switch (i.customId) {
                case "redo1":
                    amount--
                    if (amount < 2) controlRow.components[0].setDisabled(true)
                    if (Math.floor((itemInfo[0].price) * (amount - 1)) <= farm.economy.money) controlRow.components[3].setDisabled(false)
                    let embed1 = new EmbedBuilder().setTitle(`🛒 Purchasing Process`).addFields({ name: `📦 Item`, value: `${itemInfo[0].emoji} \`${itemInfo[0].name}\``, inline: true }, { name: `🛍 Amount`, value: `${amount}`, inline: true }, { name: `💵 Price`, value: `\`${Math.floor(itemInfo[0].price * amount)}\``, inline: true }, { name: `🏷 Type`, value: `\`${itemInfo[0].type}\``, inline: true }, { name: `🏷 Description`, value: `\`\`\`${itemInfo[0].description}\`\`\`` }).setColor("Orange")
                    i.editReply({ embeds: [embed1], components: [controlRow] })
                    collector.resetTimer()
                    break;
                case "buy":
                    if (Math.floor((itemInfo[0].price * amount)) >= farm.economy.money) {
                        i.editReply({ embeds: [new EmbedBuilder().setTitle(`❌ Purchase Process Cancelled`).setDescription(`Oops! You do not have the enough 💵 \`Money\` to get the selected item!`).setColor("Red")], components: [] })
                    } else {
                        if (itemInfo[0].name == "Sodium River") {
                            if (farm.cooldowns.some((v) => v.name == "Extraction")) { i.editReply({ embeds: [new EmbedBuilder().setTitle(`Hold Up!`).setDescription(`You already rented a river... Wait till you can rent a new one!`).setFooter({ text: `You can close this message now!` })], components: [] }); return collector.stop() }
                            farm.economy.money -= Math.floor(itemInfo[0].price * amount)
                            let curTime = Date.parse(moment(new Date()))
                            curTime = Date.parse(moment(curTime).add(1, "day"))
                            farm.cooldowns.push({ name: "Extraction", emoji: "🧂", time: curTime })
                            i.editReply({ embeds: [new EmbedBuilder().setTitle(`✅ Rented!`).setDescription(`You just rented x 1 of 🌊 \`${itemInfo[0].name}\`\n\nYou can now wait till you can get salt!`).setFooter({ text: `You can close this message now!` })], components: [] });
                            await farmer.findOneAndUpdate({ userId: interaction.user.id }, { economy: farm.economy, cooldowns: farm.cooldowns })
                        } else {
                            farm.economy.money -= Math.floor(itemInfo[0].price * amount)
                            if (farm.inventory.some((v) => v.name == itemInfo[0].name && v.type == itemInfo[0].type)) {
                                farm.inventory[farm.inventory.map((x) => x.name).indexOf(itemInfo[0].name)].amount += amount;
                            } else {
                                farm.inventory.push({ name: itemInfo[0].name, type: itemInfo[0].type, emoji: itemInfo[0].emoji, amount: amount })
                            }
                            i.editReply({ embeds: [new EmbedBuilder().setTitle(`✅ Purchase Succesfully`).setColor("Green").setDescription(`You just purchased with an amount of 💵 \`${Math.floor((itemInfo[0].price * amount))}\` in ${itemInfo[0].emoji} \`${itemInfo[0].name}\` x \`${amount}\`\n\nThe item will appear in your inventory.`)], components: [] })
                            await farmer.findOneAndUpdate({ userId: interaction.user.id }, { economy: farm.economy, inventory: farm.inventory })
                        }
                    }
                    collector.stop()
                    break;
                case "cancel":
                    i.editReply({ embeds: [new EmbedBuilder().setTitle(`📦 Purchasing Process Cancelled`).setColor("Red").setDescription(`You just cancelled the purchase process. You can close the embed now!`)], components: [] })
                    collector.stop()
                    break;
                case "give1":
                    amount++
                    if (amount !== 1) controlRow.components[0].setDisabled(false)
                    if (Math.floor((itemInfo[0].price) * (amount + 1)) >= farm.economy.money) controlRow.components[3].setDisabled(true)
                    let embed2 = new EmbedBuilder().setTitle(`🛒 Purchasing Process`).addFields({ name: `📦 Item`, value: `${itemInfo[0].emoji} \`${itemInfo[0].name}\``, inline: true }, { name: `🛍 Amount`, value: `${amount}`, inline: true }, { name: `💵 Price`, value: `\`${Math.floor(itemInfo[0].price * amount)}\``, inline: true }, { name: `🏷 Type`, value: `\`${itemInfo[0].type}\``, inline: true }, { name: `🏷 Description`, value: `\`\`\`${itemInfo[0].description}\`\`\`` }).setColor("Orange")
                    i.editReply({ embeds: [embed2], components: [controlRow] })
                    collector.resetTimer()
                    break;
            }
        })
        collector.on("end", (_, reason) => { return })
    }
}