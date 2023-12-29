const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')
const itemDict = require('../../config/items.json')
const moment = require('moment')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("sell")
        .setDescription("🛒 Sell your products or tools to the Community Shop")
        .addStringOption(option =>
            option
                .setName("item")
                .setDescription(`Provide the item to sell!`)
                .setRequired(true)
        ),
    // async autocomplete(client, interaction) {
    //     let choice = Array.from(client.searchBy.get(`sellBy${interaction.user.id}`))
    //     const getFocus = interaction.options.getFocused(true)
    //     choice = choice.filter((v) => v.includes(getFocus.value))
    //     if (choice > 25) choice.slice(0, 25)
    //     // var values = choice.split(" ").splice(1).toLowerCase()
    //     await interaction.respond(choice.map(choice => ({ name: choice, value: choice.split(" ").splice(1).toLowerCase() })))
    // },
    async run(client, interaction) {
        const idItem = interaction.options.getString("item")
        client.searchBy.delete(`sellBy${interaction.user.id}`)
        let farm = await farmer.findOne({ userId: interaction.user.id })
        if (!farm) return interaction.reply({ content: `You do not have any account to sell items!`, ephemeral: true })
        const controlRow = new ActionRowBuilder()
            .addComponents(new ButtonBuilder().setCustomId("redo1").setLabel(`< -1`).setStyle(Discord.ButtonStyle.Secondary))
            .addComponents(new ButtonBuilder().setCustomId("sell").setLabel("Sell").setEmoji("📦").setStyle(Discord.ButtonStyle.Success))
            .addComponents(new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setEmoji("❎").setStyle(Discord.ButtonStyle.Danger))
            .addComponents(new ButtonBuilder().setCustomId("give1").setLabel(`+1 >`).setStyle(Discord.ButtonStyle.Secondary))

        var temporalFilter = farm.inventory.filter((v) => v.type !== "seed")

        var getItem = temporalFilter[temporalFilter.map((v) => v.name.toLowerCase()).indexOf(idItem.toLowerCase())]
        let amount = 1
        var getData = getItem.type == "tool" ? itemDict.tool : getItem.type == "products" ? itemDict.products : getItem.type == "misc" ? itemDict.misc : null
        if (getData == null) return interaction.reply({ content: `The selected item is not able to sell!`, ephemeral: true })
        var getPrice = getData[getData.map((v) => v.name.toLowerCase()).indexOf(idItem.toLowerCase())]
        var embed = new EmbedBuilder().setTitle("📦 Selling Item").setThumbnail("https://media.giphy.com/media/0cSvAXa7wKtCj1ASm9/giphy.gif").setColor("Green").addFields({ name: `📦 Item`, value: `${getItem.emoji} ${getItem.name}`, inline: true }, { name: `🟠 Type`, value: `${getPrice.type}`, inline: true }, { name: `💸 Price`, value: `💵 \`${getPrice.price}\``, inline: true }).setFooter({ text: `Remember, The unstackable items only can be selled one per selling process.` })
        if (getPrice.stackable == false) { controlRow.components[0].setDisabled(true); controlRow.components[3].setDisabled(true) }
        if (getPrice.stackable == true && amount <= 1) { controlRow.components[0].setDisabled(true); embed.addFields({ name: `🛍 Amount`, value: `${amount}`, inline: true }) }

        if (amount >= getItem.amount) { controlRow.components[3].setDisabled(true); }

        let msg = await interaction.reply({ embeds: [embed], components: [controlRow], ephemeral: true })
        const collector = interaction.channel.createMessageComponentCollector({ componentType: Discord.ComponentType.Button, idle: 7000 })
        collector.on("collect", async i => {
            await i.deferUpdate()
            switch (i.customId) {
                case "redo1":
                    amount--
                    if (amount < 2) { controlRow.components[0].setDisabled(true) }
                    var embed = new EmbedBuilder().setTitle("📦 Selling Item").setThumbnail("https://media.giphy.com/media/0cSvAXa7wKtCj1ASm9/giphy.gif").setColor("Green").addFields({ name: `📦 Item`, value: `${getItem.emoji} ${getItem.name}`, inline: true }, { name: `🟠 Type`, value: `${getPrice.type}`, inline: true }, { name: `💸 Price`, value: `💵 \`${Math.floor(getPrice.price * amount)}\``, inline: true }, { name: `🛍 Amount`, value: `${amount}`, inline: true }).setFooter({ text: `Remember, The unstackable items only can be selled one per selling process.` })
                    i.editReply({ embeds: [embed], components: [controlRow], ephemeral: true })
                    collector.resetTimer()
                    break;
                case "sell":
                    var check = getItem.amount -= amount
                    var getTotalPrice2give = Math.floor(getPrice.price * amount)
                    farm.economy.money += getTotalPrice2give
                    i.editReply({ embeds: [new EmbedBuilder().setTitle(`✅ Selling Process Successfully!`).setColor("Green").setDescription(`You just selled x ${amount} of ${getItem.emoji} for 💵 \`${getTotalPrice2give}\``).setFooter({ text: `You can't undone this movement... The money will be immediatly in your wallet! You can close this embed!` }).setTimestamp()], components: [] })
                    if (check < 1) { farm.inventory = farm.inventory.filter((x) => x.amount >= 1) }
                    await farmer.findOneAndUpdate({ userId: i.user.id }, { economy: farm.economy, inventory: farm.inventory })
                    collector.stop()
                    break;
                case "cancel":
                    i.editReply({ embeds: [new EmbedBuilder().setTitle(`✅ Selling Cancelled`).setDescription(`You just cancelled the selling of the item... You can close this embed now!`).setColor("Red")], components: [], ephemeral: true })
                    collector.stop()
                    break;
                case "give1":
                    // Math.floor((amount + 1) * getPrice.price) >= farm.economy.money ||
                    amount++
                    if (amount != 1) { controlRow.components[0].setDisabled(false) }
                    if (amount >= getItem.amount) { controlRow.components[3].setDisabled(true) }
                    var embed = new EmbedBuilder().setTitle("📦 Selling Item").setThumbnail("https://media.giphy.com/media/0cSvAXa7wKtCj1ASm9/giphy.gif").setColor("Green").addFields({ name: `📦 Item`, value: `${getItem.emoji} ${getItem.name}`, inline: true }, { name: `🟠 Type`, value: `${getPrice.type}`, inline: true }, { name: `💸 Price`, value: `💵 \`${Math.floor(getPrice.price * amount)}\``, inline: true }, { name: `🛍 Amount`, value: `${amount}`, inline: true }).setFooter({ text: `Remember, The unstackable items only can be selled one per selling process.` })
                    i.editReply({ embeds: [embed], components: [controlRow], ephemeral: true })
                    collector.resetTimer()
                    break;
            }
        })
        collector.on("end", (_, reason) => { return })
    }
}