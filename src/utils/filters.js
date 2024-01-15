const farmer = require('../schema/farmer')
const Discord = require('discord.js')

module.exports = {
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
    },
    async generateRaid(client, interaction, user, userTarget) {
        const row = new Discord.ActionRowBuilder().addComponents(new Discord.ButtonBuilder().setLabel("Rob").setEmoji("💥").setStyle(Discord.ButtonStyle.Secondary).setCustomId("money")).addComponents(new Discord.ButtonBuilder().setLabel("Plots").setEmoji("🌱").setStyle(Discord.ButtonStyle.Secondary).setCustomId("plot").setDisabled(true))
        if (userTarget.plotsSlot.length > 0) row.components[1].setDisabled(false)
        let msg = await interaction.reply({ embeds: [new Discord.EmbedBuilder().setImage("https://media.giphy.com/media/3o6wNPIj7WBQcJCReE/giphy.gif").setDescription(`Select an option to make a raid <@${userTarget.userId}>!`)], ephemeral: true, components: [row] })
        const collector = interaction.channel.createMessageComponentCollector({ componentType: Discord.ComponentType.Button })
        collector.on("collect", async (i) => {
            await i?.deferUpdate()
            let prob = Math.random() * 100
            switch (i.customId) {
                case "money":
                    i?.editReply({ embeds: [new Discord.EmbedBuilder().setTitle(`💥 You just started a raid!`).setDescription(`You got inside from <@${userTarget.userId}>'s house... Let's see what did you could steal.`)], components: [] })
                    setTimeout(async () => {
                        if (prob <= 45) {
                            let amount = Math.floor(Math.random() * userTarget.economy.money)
                            i.editReply({ content: `✅ Sending Succes message!`, embeds: [] })
                            i?.channel.send({ content: `${interaction.user} just Raided <@${userTarget.userId}>`, embeds: [new Discord.EmbedBuilder().setTitle(`🔥 Raid Succesfully`).setDescription(`You just stole 💵 \`${amount}\` from <@${userTarget.userId}>!`)], components: [] })
                            userTarget.economy.money -= amount; user.economy.money += amount;
                            await farmer.findOneAndUpdate({ userId: userTarget.userId }, { economy: userTarget.economy })
                        } else {
                            i?.editReply({ embeds: [new Discord.EmbedBuilder().setTitle(`🏳 You just failed the Raid!`).setDescription(`It seems like the victim was lucky defending their money!\n\nYou have to pay 💵 \`50\``)], components: [] })
                            user.economy.money -= 50; userTarget.economy.money += 50;
                            await farmer.findOneAndUpdate({ userId: userTarget.userId }, { economy: userTarget.economy })
                        }
                        await farmer.findOneAndUpdate({ userId: user.userId }, { economy: user.economy })
                        return collector.stop()
                    }, 5000);
                    break;
                case "plot":
                    i?.editReply({ embeds: [new Discord.EmbedBuilder().setTitle(`💥 You just started a raid!`).setDescription(`You got inside from <@${userTarget.userId}>'s house... Let's see what did you could steal.`)], components: [] })
                    setTimeout(async () => {
                        if (prob <= 30) {
                            let getVictimPlot = userTarget.plotsSlot[Math.floor(Math.random() * (userTarget.plotsSlot.length - 1))]
                            i?.editReply({ content: `✅ Sending Succesfully Message`, embeds: [] })
                            i?.channel.send({ content: `${interaction.user} just raided <@${userTarget.userId}>`, embeds: [new Discord.EmbedBuilder().setTitle(`🔥 Raid Succesfully!`).setDescription(`The user ${interaction.user} just detroyed one of <@${userTarget.userId}>'s Plots`).addFields({ name: `Affected Plot`, value: `${getVictimPlot.emoji} \`${getVictimPlot.plant}\`` })] })
                            userTarget.plotsSlot = userTarget.plotsSlot.filter((x) => x.plotSlot !== getVictimPlot.plotSlot)
                            await farmer.findOneAndUpdate({ userId: userTarget.userId }, { plotsSlot: userTarget.plotsSlot })
                        } else {
                            i?.editReply({ embeds: [new Discord.EmbedBuilder().setTitle(`🏳 You just failed the Raid!`).setDescription(`It seems like the victim was lucky defending their plots`)], components: [] })
                        }
                        return collector.stop()
                    }, 5000);
                    break;
            }
        })
    },
    async giveAllPlayers(items, amount) {
        try {
            // People who has the item
            await farmer.updateMany({ inventory: { $elemMatch: { name: items.name, type: items.type } } },
                { "$inc": { "inventory.$.amount": amount } }
            ).catch((e) => console.log(e))
        } catch (error) {
            console.log(error)
        }
    }
}