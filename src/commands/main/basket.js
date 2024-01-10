const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')
const seeds = require('../../config/seeds.json')
const { createPagination, giveListItem } = require('../../utils/functions')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("basket")
        .setDescription("🌱 Check the vegetables or fruits to collect."),
    async run(client, interaction) {
        let getFarmerInfo = await farmer.findOne({ userId: interaction.user.id })
        if (!getFarmerInfo) return interaction.reply({ content: `You have not your home open to check the basket!`, ephemeral: true })
        if (getFarmerInfo.basket.length < 1) return interaction.reply({ content: `Your plots are not even given their products.`, ephemeral: true })
        let products = []
        let limitXEmbed = 6
        for (let i = 0; i < getFarmerInfo.basket.length; i += limitXEmbed) {
            let pp = getFarmerInfo.basket.slice(i, i + limitXEmbed)
            pp.map((x, i) => products.push({ name: `\`${i + 1}\` ${x.emoji} ${x.product}`, value: `Amount: ${x.amount}`, inline: true }))
        }
        let embeds = []
        for (let i = 0; i < getFarmerInfo.basket.length; i += limitXEmbed) {
            let content = products.slice(i, i + limitXEmbed)
            const embed = new EmbedBuilder().setTitle(`🎒 Your basket`).setThumbnail(interaction.user.displayAvatarURL()).setDescription(`\`\`\`All your fruits/vegetables will appear here when their plots are ready to be collected. You can choose between Sell them or Keep them.\`\`\``).setColor("Green").addFields(content)
            embeds.push(embed)
        }
        const rowControl = new Discord.ActionRowBuilder()
            .addComponents(new ButtonBuilder().setCustomId("sell").setLabel("Sell").setEmoji("💵").setStyle(Discord.ButtonStyle.Success))
            .addComponents(new ButtonBuilder().setCustomId("keep").setLabel("Collect").setEmoji("📦").setStyle(Discord.ButtonStyle.Secondary))

        if (embeds.length < 2) {
            let msg = await interaction.reply({ embeds: [embeds[0]], components: [rowControl] })
            let filter = (i) => i.user.id == interaction.user.id
            const collector = interaction.channel.createMessageComponentCollector({ time: 90000, idle: 7000, componentType: Discord.ComponentType.Button, filter })

            collector.on("collect", async (x) => {
                await x.deferUpdate()
                switch (x.customId) {
                    case "sell":
                        x.editReply({ content: `📤 Selling ...`, embeds: [], components: [] })
                        setTimeout(async () => {
                            var outPut = ""
                            let totalMoney = 0
                            let farm = await farmer.findOne({ userId: x.user.id })
                            farm.basket.forEach((x) => {
                                let getPos = seeds[seeds.map((v) => v.name).indexOf(x.product)]
                                var getTotalMoneyXP = Math.floor(getPos.item.price * x.amount)
                                totalMoney += getTotalMoneyXP
                                outPut += `${x.emoji} **${x.product}** x${x.amount} -> 💵 \`${getTotalMoneyXP}\`\n`
                                farm.basket = farm.basket.filter((d) => d.product !== x.product)
                            })
                            farm.economy.money += totalMoney
                            await farmer.findOneAndUpdate({ userId: x.user.id }, { economy: farm.economy, basket: farm.basket })
                            x.editReply({ content: ``, embeds: [new Discord.EmbedBuilder().setTitle(`📦 Billing Registry`).setDescription(outPut.substring(0, 2048)).setThumbnail(interaction.user.displayAvatarURL()).setColor("Green").setTimestamp().addFields({ name: "Total:", value: `💵 \`${totalMoney}\`` })] }).then(() => setTimeout(() => x.deleteReply(), 10000))
                            collector.stop()
                        }, 5000)
                        break;
                    case "keep":
                        x.editReply({ content: `📥 Collecting ...`, embeds: [], components: [] })
                        setTimeout(async () => {
                            let ff = await farmer.findOne({ userId: x.user.id })
                            let itemsToInv = []
                            ff.basket.forEach((v) => { itemsToInv.push({ item: v.product, type: "products", emoji: v.emoji, amount: v.amount }) })
                            await giveListItem(itemsToInv, ff)
                            await farmer.findOneAndUpdate({ userId: x.user.id }, { basket: [] })
                            x.editReply({ content: ``, embeds: [new Discord.EmbedBuilder().setTitle(`🗃 Collecting Products`).setDescription(`\`All your products are saved in your inventory! Check them.\``).setColor("Green")] }).then(() => setTimeout(() => x.deleteReply(), 5000)).catch((error) => { })
                            collector.stop()
                        }, 5000)
                        break;
                }
            })

            collector.on("end", (col, reason) => {
                if (reason == "time") {
                    interaction.editReply({ components: [] })
                    return;
                } else if (reason == "idle") {
                    return;
                }
            })
        } else {
            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder().setCustomId("redo").setLabel("< Previous").setStyle(Discord.ButtonStyle.Primary))
                .addComponents(new ButtonBuilder().setCustomId("frwd").setLabel("Next >").setStyle(Discord.ButtonStyle.Primary))
            await createPagination(client, interaction, embeds, row, rowControl)
        }
    }
}