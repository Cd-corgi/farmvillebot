const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder } = require('discord.js')
const Discord = require('discord.js')
const rr = require('../../schema/roullete')
const { getRarrity, validItems } = require('../../utils/functions')
const validItem = require('../../config/items.json')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    ownerOnly: true,
    data: new SlashCommandBuilder()
        .setName("add-roullete-item")
        .setDescription("Add the ite to the roullete!")
        .setDefaultMemberPermissions(0),
    async run(client, interaction) {
        const items = await rr.find({})
        if (items.length >= 10) return interaction.reply({ content: `Hey man, there's more than 10 objects...`, ephemeral: true })
        const modal = new ModalBuilder().setTitle(`Add Roullete Prize`).setCustomId("rr")
        const itemName = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("itemName").setLabel("Item Name").setRequired(true).setStyle(Discord.TextInputStyle.Short).setMinLength(3)); const itemType = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("itemType").setLabel("Item Type").setRequired(true).setStyle(Discord.TextInputStyle.Short).setMinLength(3)); const emoji = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("itemEmoji").setLabel("Item Emoji").setRequired(true).setMaxLength(10).setStyle(Discord.TextInputStyle.Short)); const probability = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("itemProbability").setLabel("Probability").setMaxLength(4).setRequired(true).setStyle(Discord.TextInputStyle.Short)); const amount = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("itemAmount").setLabel("Amount to give").setRequired(true).setStyle(Discord.TextInputStyle.Short))
        modal.addComponents(itemName, itemType, emoji, probability, amount)
        await interaction.showModal(modal)
        const submitt = await interaction.awaitModalSubmit({ time: 9999999 }).catch((error) => { return null })
        if (submitt) {
            if (isNaN(submitt.fields.getTextInputValue("itemAmount")) || isNaN(submitt.fields.getTextInputValue("itemProbability"))) return submitt.reply({ content: `There's one of the numeric fields marked as not numeric values!`, ephemeral: true })
            let rarity = await getRarrity(submitt.fields.getTextInputValue("itemProbability"))
            var item = { name: submitt.fields.getTextInputValue("itemName"), type: submitt.fields.getTextInputValue("itemType") }
            let isValid = validItems(item);
            if (isValid == null) return submitt.reply({ content: `This item is not existing in my registry.`, ephemeral: true })
            const embeds = new EmbedBuilder().setTitle(`Resgistering item to the roullete!`).setColor("LuminousVividPink").addFields({ name: `📦 Item Added`, value: `${isValid.emoji} ${isValid.name}`, inline: true }, { name: `✨ Rarity`, value: `${rarity == "Guaranted" ? `⭐ Guaranted` : rarity == "Common" ? `🔵 Common` : rarity == "Uncommon" ? `🟢 Uncommon` : rarity == "Rare" ? `🟠 Rare` : rarity == "Very Rare" ? `🟣 Very Rare` : rarity == "Impossible" ? `🔴 Impossible` : rarity == "Unique" ? `✨ Unique` : `😶 Unknown`}`, inline: true }, { name: `💮 Amount`, value: `${submitt.fields.getTextInputValue("itemAmount")}` })
            submitt.reply({ embeds: [embeds] }).then(() => setTimeout(() => submitt.deleteReply(), 5000)).catch((error) => { })
            setTimeout(async () => { new rr({ item: isValid.name, emoji: isValid.emoji, type: isValid.type, probability: (submitt.fields.getTextInputValue("itemProbability") / 100), rarity: rarity, amount: submitt.fields.getTextInputValue("itemAmount") }).save() }, 5000)
        }
    }
}
