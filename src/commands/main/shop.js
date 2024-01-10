const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')
const gShop = require('../../schema/gardenShop')
const { loadEmbeds, createPagination } = require('../../utils/functions')
const moment = require('moment')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("shop")
        .setDescription("🛒 Check the community and the garden shop. Where the users can give their items to the market")
        .addStringOption(option =>
            option
                .setName("info")
                .setDescription(`Provide the item name to get information of it.`)
        ),
    async run(client, interaction) {
        const info = interaction.options.getString("info")
        let getFarmer = await farmer.findOne({ userId: interaction.user.id })
        if (!getFarmer) return interaction.reply({ content: `You do not have your house open yet!`, ephemeral: true })
        var limitXEmbed = 9
        let getOItems = await gShop.find({}).sort({ "name": 1 })
        if (getOItems.length < 1) return interaction.reply({ content: `There's no items in the shop...`, ephemeral: true })
        if (info !== null) { if (!getOItems.some((v) => v.name.toLowerCase() == info.toLowerCase())) { return interaction.reply({ content: `There's no item with this name... Try to write it good or Check if that item exists.`, ephemeral: true }) } }
        const row = new ActionRowBuilder().addComponents(new Discord.ButtonBuilder().setCustomId("redo").setLabel("< Redo").setStyle(Discord.ButtonStyle.Primary)).addComponents(new Discord.ButtonBuilder().setCustomId("frwd").setLabel("Next >").setStyle(Discord.ButtonStyle.Primary))
        let infos = []
        for (let i = 0; i < getOItems.length; i += limitXEmbed) {
            let item = getOItems.slice(i, i + limitXEmbed)
            item.map((x) => infos.push({ name: `${x.emoji} \`${x.name}\``, value: `💵 \`${x.price}\` | **${x.type}**`, inline: true }))
        }
        var embeds = []
        for (let index = 0; index < getOItems.length; index += limitXEmbed) {
            let item = infos.slice(index, index + limitXEmbed)
            const embed1 = new Discord.EmbedBuilder().setTitle(`🛒 Garden Shop`).setColor("Random").addFields(item)
            embeds.push(embed1)
        }
        let filter = (i) => i.user.id == interaction.user.id
        const collector = interaction.channel.createMessageComponentCollector({ time: 20000, filter, idle: 10000 })
        if (embeds.length < 1) {
            return interaction.reply({ embeds: [embeds[0]] })
        }
        let i = 0
        let msg = await interaction.reply({ embeds: [embeds[i].setFooter({ text: `${i + 1} / ${embeds.length}` })], components: [row] })
        collector.on("collect", async x => {
            await x.deferUpdate()
            switch (x.customId) {
                case "redo":
                    if (i !== 0) { i--; x.editReply({ embeds: [embeds[i].setFooter({ text: `${i + 1} / ${embeds.length}` })], components: [row] }) } else { i = embeds.length - 1; x.editReply({ embeds: [embeds[i].setFooter({ text: `${i + 1} / ${embeds.length}` })], components: [row] }) }
                    collector.resetTimer()
                    break;
                case "frwd":
                    if (i < embeds.length - 1) { i++; x.editReply({ embeds: [embeds[i].setFooter({ text: `${i + 1} / ${embeds.length}` })], components: [row] }) } else { i = 0; x.editReply({ embeds: [embeds[i].setFooter({ text: `${i + 1} / ${embeds.length}` })], components: [row] }) }
                    collector.resetTimer()
                    break;
            }
        });
        collector.on("end", async (_, reason) => {
            try { interaction.editReply({ embeds: [embeds[i].setFooter({ text: `${i + 1} / ${embeds.length}` })], components: [] }) } catch (error) { return }
        })
    }
}