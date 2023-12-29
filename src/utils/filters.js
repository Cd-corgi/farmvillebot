const farmer = require('../schema/farmer')
const Discord = require('discord.js')

module.exports = {
    async clearFilter(client, us, DEmbeds) {
        var farmers = await farmer.findOne({ userId: us.user.id })
        let items = []
        let limitXEmbed = 6
        for (let i = 0; i < farmers.inventory.length; i += limitXEmbed) {
            let item = farmers.inventory.slice(i, i + limitXEmbed)
            item.map((x) => items.push({ name: `${x.emoji} ${x.name}`, value: `${x.type} x${x.amount}`, inline: true }))
        }
        DEmbeds = []
        for (let i = 0; i < farmers.inventory.length; i += limitXEmbed) {
            let item = items.slice(i, i + limitXEmbed)
            const embed = new Discord.EmbedBuilder().setTitle(`🎒 Inventory`).setThumbnail(us.user.displayAvatarURL()).addFields(item).setColor("Green")
            DEmbeds.push(embed)
        }
        return DEmbeds
    },
    async prepareFilter(consulta, limitXEmbed, interaction) {
        var newEmbeds = []
        var filteredItems = []
        for (let i = 0; i < consulta.length; i += limitXEmbed) {
            var items = consulta.slice(i, i + limitXEmbed)
            items.map((z) => filteredItems.push({ name: `${z.emoji} ${z.name}`, value: `${z.type} x ${z.amount}`, inline: true }))
        }
        for (let i = 0; i < filteredItems.length; i += limitXEmbed) {
            var givinItems = filteredItems.slice(i, i + limitXEmbed)
            const embed = new Discord.EmbedBuilder().setTitle(`🎒 Inventory`).setThumbnail(interaction.user.displayAvatarURL()).addFields(givinItems).setColor("Green")
            newEmbeds.push(embed)
        }
        return newEmbeds
    },
    getItems() {
        let itemList = [{ name: "Money", emoji: "💵", min: 50, max: 200, probability: 1.00 }, { name: "Eggplants", emoji: "🍆", type: "seed", min: 1, max: 5, probability: 0.45 }, { name: "Herbs", emoji: "🌿", type: "seed", min: 1, max: 10, probability: 0.65 }, { name: "Cherries", emoji: "🍒", type: "seed", min: 3, max: 15, probability: 0.25 }]
        let itemGotten = []
        for (let i = 0; i < itemList.length; i++) {
            let prob = Math.round(Math.random() * 100) / 100;
            if (prob <= itemList[i].probability) {
                var getRange = Math.floor(Math.random() * (itemList[i].max - itemList[i].min) + itemList[i].min)
                if (itemList[i].type == null) {
                    itemGotten.push({ name: itemList[i].name, emoji: itemList[i].emoji, amount: getRange })
                } else {
                    itemGotten.push({ name: itemList[i].name, emoji: itemList[i].emoji, type: itemList[i].type, amount: getRange })
                }
            }
        }
        return itemGotten
    }
}