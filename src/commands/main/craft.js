const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')
const recipes = require('../../dictionary/crafting.json')
const { checkRecipes, givingItems } = require('../../utils/functions')
module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("craft")
        .setDescription("🔨 Explore the items to craft, make sure that you have the ingredients!"),
    async run(client, interaction) {
        const farm = await farmer.findOne({ userId: interaction.user.id })
        if (!farm) return interaction.reply({ content: `You do not have a home openned yet!`, ephemeral: true })
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("redo").setLabel("<").setStyle(Discord.ButtonStyle.Secondary)).addComponents(new ButtonBuilder().setCustomId("craft").setLabel("Craft!").setEmoji("🔨").setStyle(Discord.ButtonStyle.Success)).addComponents(new ButtonBuilder().setCustomId("frwd").setLabel(">").setStyle(Discord.ButtonStyle.Secondary))
        const embeds = []
        for (let i = 0; i < recipes.length; i++) {
            const embed = new EmbedBuilder().setTitle(`📦 Crafting Recipes ${i + 1} / ${recipes.length}`).addFields({ name: `🔨 Item`, value: `${recipes[i].emoji} ${recipes[i].item}`, inline: true }, { name: `🛍 Amount`, value: `\`${recipes[i].amountResult}\` Units`, inline: true }, { name: `📄 Type`, value: `${recipes[i].type}`, inline: true }, { name: `💼 Recipe`, value: recipes[i].recipe.map((x) => `${x.name} \`${x.type}\` x${x.amount} ${farm.inventory.some((y) => y.name == x.name && y.type == x.type && y.amount >= x.amount) ? `✅` : `❌`}`).join("\n") }, { name: `📦 Description`, value: `\`\`\`${recipes[i].description}\`\`\`` }).setColor("Red")
            embeds.push(embed)
        }
        let curPage = 0
        if (curPage == 0) row.components[0].setDisabled(true)
        var isCraft = await checkRecipes(recipes[curPage], farm)
        if (isCraft == false) { row.components[1].setDisabled(true) } else { row.components[1].setDisabled(false) }
        let msg = await interaction.reply({ embeds: [embeds[curPage]], components: [row], ephemeral: true })
        const collector = interaction.channel.createMessageComponentCollector({ time: 99999999, idle: 10000, componentType: Discord.ComponentType.Button })
        collector.on("collect", async i => {
            await i?.deferUpdate()
            switch (i.customId) {
                case "redo":
                    curPage--
                    if (curPage !== 0) { row.components[0].setDisabled(false) }
                    if (curPage < 1) { row.components[0].setDisabled(true) }
                    if (curPage !== recipes.length - 1) { row.components[2].setDisabled(false) }
                    var isCraft = await checkRecipes(recipes[curPage], farm)
                    if (isCraft == false) { row.components[1].setDisabled(true) } else { row.components[1].setDisabled(false) }
                    i.editReply({ embeds: [embeds[curPage]], components: [row] })
                    collector.resetTimer()
                    break;
                case "craft":
                    farm.inventory.forEach((x, i) => {
                        let item = recipes[curPage].recipe.filter((v) => v.name == x.name && v.type == x.type)
                        if (item.length >= 1) { x.amount -= item[0].amount }
                    })
                    farm.inventory = farm.inventory.filter(c => c.amount > 0)
                    let itemCrafted = { item: recipes[curPage].item, emoji: recipes[curPage].emoji, type: recipes[curPage].type, amount: recipes[curPage].amountResult }
                    await givingItems(itemCrafted, farm)
                    i.editReply({ embeds: [new EmbedBuilder().setTitle(`${recipes[curPage].emoji} ${recipes[curPage].item} Have been crafted!`).setDescription(`You just crafted x ${recipes[curPage].amountResult} of ${recipes[curPage].emoji} \`${recipes[curPage].item}\` and added to your inventory now!`).setColor("Green")], components: [] })
                    collector.stop()
                    break;
                case "frwd":
                    curPage++
                    if (curPage !== 0) { row.components[0].setDisabled(false) }
                    if (curPage >= recipes.length - 1) { row.components[2].setDisabled(true) } else { row.components[2].setDisabled(false) }
                    var isCraft = await checkRecipes(recipes[curPage], farm)
                    if (isCraft == false) { row.components[1].setDisabled(true) } else { row.components[1].setDisabled(false) }
                    i.editReply({ embeds: [embeds[curPage]], components: [row] })
                    collector.resetTimer()
                    break;
            }
        })


    }
}