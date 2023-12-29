const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ModalBuilder } = require('discord.js')
const Discord = require('discord.js')
const gShop = require('../../schema/gardenShop')

module.exports = {
    permissions: [PermissionFlagsBits.Administrator],
    botP: [PermissionFlagsBits.SendMessages],
    ownerOnly: true,
    data: new SlashCommandBuilder()
        .setName("add-items")
        .setDefaultMemberPermissions(0)
        .setDescription("Add Items to the Garden Shop"),
    async run(client, interaction) {
        const modal = new ModalBuilder().setCustomId("adding-item").setTitle(`Add to the Garden Shop`)
        const nameItem = new Discord.TextInputBuilder().setCustomId("name").setLabel(`Name of the Item`).setPlaceholder(`An item name!`).setStyle(Discord.TextInputStyle.Short).setRequired(true); const descItem = new Discord.TextInputBuilder().setCustomId("desc").setLabel(`Give a description`).setPlaceholder(`This times does this.`).setMaxLength(300).setRequired(true).setStyle(Discord.TextInputStyle.Paragraph); const priceItem = new Discord.TextInputBuilder().setCustomId("price").setLabel(`Price of the item`).setPlaceholder(`It cost a lot!`).setStyle(Discord.TextInputStyle.Short).setRequired(true); const typeItem = new Discord.TextInputBuilder().setCustomId("type").setLabel(`Type of the item`).setPlaceholder(`Hmm, it looks useful`).setStyle(Discord.TextInputStyle.Short).setRequired(true); const emojiItem = new Discord.TextInputBuilder().setCustomId("emoji").setLabel(`Give them an emoji`).setPlaceholder(`Cute icon`).setStyle(Discord.TextInputStyle.Short).setRequired(true)
        const row1 = new ActionRowBuilder().addComponents(nameItem); const row2 = new ActionRowBuilder().addComponents(descItem); const row3 = new ActionRowBuilder().addComponents(priceItem); const row4 = new ActionRowBuilder().addComponents(typeItem); const row5 = new ActionRowBuilder().addComponents(emojiItem);
        modal.addComponents(row1, row2, row3, row4, row5)

        await interaction.showModal(modal)
        const submitted = await interaction.awaitModalSubmit({ time: 900000 }).catch((error) => { return null })
        if (submitted) {
            var infoObtained = []
            if (isNaN(parseInt(submitted.fields.getTextInputValue("price")))) return submitted.reply({ content: `This field is only acceped with numbers!`, ephemeral: true })
            infoObtained.push({ name: submitted.fields.getTextInputValue("name"), description: submitted.fields.getTextInputValue("desc"), type: submitted.fields.getTextInputValue("type"), price: submitted.fields.getTextInputValue("price"), emoji: submitted.fields.getTextInputValue("emoji") })
            infoObtained[0].stackable = submitted.fields.getTextInputValue("type") == "tool" ? false : true
            let checkExisting = await gShop.find({})
            if (checkExisting.some((x) => x.name.toLowerCase() == submitted.fields.getTextInputValue("name").toLowerCase())) return submitted.reply({ content: `This item already exists...`, ephemeral: true })
            const embed = new Discord.EmbedBuilder().setTitle(`⏺ Item Information`).addFields({ name: `🎃 Item Name`, value: `\`${infoObtained[0].name}\``, inline: true }, { name: `😶 Emoji`, value: `${infoObtained[0].emoji}`, inline: true }, { name: `🏷 Type`, value: `${infoObtained[0].type}`, inline: true }, { name: `🛍 Price`, value: `${infoObtained[0].price}`, inline: true }, { name: `💬 Description`, value: `${infoObtained[0].description}` },)
            await submitted.deferReply({ ephemeral: true })
            submitted.followUp({ embeds: [embed] })
            setTimeout(() => {
                new gShop({ name: infoObtained[0].name, description: infoObtained[0].description, type: infoObtained[0].type, price: infoObtained[0].price, emoji: infoObtained[0].emoji }).save()
            }, 3000)
        }
    }
}