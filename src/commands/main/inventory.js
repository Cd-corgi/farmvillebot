const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')
const { createInventoryPages } = require('../../utils/functions')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("inventory")
        .setDescription("Check your items in your inventory"),
    async run(client, interaction) {
        const farmers = await farmer.findOne({ userId: interaction.user.id })
        if (!farmers) return interaction.reply({ content: `You do not have your house opened...`, ephemeral: true })
        let items = []
        let limitXEmbed = 6
        for (let i = 0; i < farmers.inventory.length; i += limitXEmbed) {
            let item = farmers.inventory.slice(i, i + limitXEmbed)
            item.map((x) => items.push({ name: `${x.emoji} ${x.name}`, value: `${x.type} x${x.amount}`, inline: true }))
        }
        let embeds = []
        for (let i = 0; i < farmers.inventory.length; i += limitXEmbed) {
            let item = items.slice(i, i + limitXEmbed)
            const embed = new EmbedBuilder().setTitle(`🎒 Inventory`).setThumbnail(interaction.user.displayAvatarURL()).addFields(item).setColor("Green")
            embeds.push(embed)
        }

        const Filterrow = new ActionRowBuilder()
            .addComponents(new StringSelectMenuBuilder().setCustomId("filters").setPlaceholder("Select the type of item!").addOptions({ label: "Seeds", value: "seed", emoji: "🌱" }, { label: "Tools", value: "tool", emoji: "⛏" }, { label: "Products", value: "products", emoji: "🍓" }, { label: "Fishes", value: "fishes", emoji: "🐠" }, { label: "Crates", value: "crate", emoji: "📦" }, { label: "Misc", value: "misc", emoji: "🐰" }, { label: "Tokens", value: "token", emoji: "🟠" }))

        const row = new ActionRowBuilder()
            .addComponents(new ButtonBuilder().setCustomId("redo").setLabel("< Previous").setStyle(Discord.ButtonStyle.Primary))
            .addComponents(new ButtonBuilder().setCustomId("clsf").setLabel("Clear Filter").setStyle(Discord.ButtonStyle.Danger).setDisabled(true))
            .addComponents(new ButtonBuilder().setCustomId("frwd").setLabel("Next >").setStyle(Discord.ButtonStyle.Primary))

        await createInventoryPages(client, interaction, embeds, row, Filterrow)

    }
}