const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("give")
        .setDescription("Give an item or money to an user.")
        .addSubcommand(option =>
            option
                .setName("money")
                .setDescription(`Give money to the user...`)
                .addNumberOption(option =>
                    option
                        .setName("amount")
                        .setDescription("Provide the amount of money to give")
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription(`Define an user to give`)
                        .setRequired(true)
                )
        )
        .addSubcommand(option =>
            option
                .setName("items")
                .setDescription("Provide items to give to someone!")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription(`Define an user to give`)
                        .setRequired(true)
                )
        ),
    async run(client, interaction) {
        const sb = interaction.options.getSubcommand()
        const user = interaction.options.getUser("user")
        const moneyAmount = interaction.options.getNumber("amount")
        if (user.id == interaction.user.id) return interaction.reply({ content: `You can't give items to yourself!`, ephemeral: true })
        let farmerAuthor = await farmer.findOne({ userId: interaction.user.id })
        if (!farmerAuthor) return interaction.reply({ content: `You do not have your home openned yet`, ephemeral: true })
        switch (sb) {
            case "money":
                let farmerTarget = await farmer.findOne({ userId: user.id })
                if (!farmerTarget) return interaction.reply({ content: `This mentioned user has not a house open!`, ephemeral: true })
                if (farmerAuthor.economy.money < moneyAmount) return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`❌ Error`).setDescription(`You do not have the enough 💵 \`Money\` to give to this user.`).setColor("Red")], ephemeral: true })
                farmerAuthor.economy.money -= moneyAmount
                if (farmerAuthor.economy.money < 1) farmerAuthor.economy.money = 0
                farmerTarget.economy.money += moneyAmount
                await interaction.deferReply()
                interaction.followUp({ content: `${user}`, embeds: [new EmbedBuilder().setTitle(`🎁 Giving Action`).setColor("Green").setDescription(`💵 \`${moneyAmount}\` have been given to ${user}!`)] }).then(() => setTimeout(() => setTimeout(() => interaction.deleteReply(), 5000))).catch(() => { })
                await farmer.updateOne({ userId: interaction.user.id }, { economy: farmerAuthor.economy })
                await farmer.updateOne({ userId: user.id }, { economy: farmerTarget.economy })
                break;
            case "items":
                let farmerTarget2 = await farmer.findOne({ userId: user.id })
                if (!farmerTarget2) return interaction.reply({ content: `This mentioned user has not a house open!`, ephemeral: true })
                if (farmerAuthor.inventory.length < 1) return interaction.reply({ content: `You do not have items to give.`, ephemeral: true })
                const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId("items").setPlaceholder(`Choose the items`).setMaxValues(1))
                const amountRow = new ActionRowBuilder().addComponents(new Discord.ButtonBuilder().setCustomId("redo1").setStyle(Discord.ButtonStyle.Secondary).setLabel("-1")).addComponents(new Discord.ButtonBuilder().setCustomId("give").setLabel("Give").setEmoji("🎁").setStyle(Discord.ButtonStyle.Success)).addComponents(new Discord.ButtonBuilder().setCustomId("cancel").setLabel(`Discard`).setEmoji("❌").setStyle(Discord.ButtonStyle.Danger)).addComponents(new Discord.ButtonBuilder().setCustomId("add1").setStyle(Discord.ButtonStyle.Secondary).setLabel("+1"))
                if (farmerAuthor.inventory.length >= 25) farmerAuthor.inventory.slice(0, 25)
                farmerAuthor.inventory.sort(function armar(a, b) { return b.name - a.name })
                farmerAuthor.inventory.forEach((x, i) => { row.components[0].addOptions({ label: `${x.name} (${x.type})`, value: `${x.name}-${x.type}`, emoji: `${x.emoji}` }) })
                let itemList = []; let defAmount = 1
                if (itemList.length < 1) { amountRow.components[0].setDisabled(true); amountRow.components[3].setDisabled(true) }
                await interaction.reply({ embeds: [new EmbedBuilder().setTitle(`🎁 Giving items to ${user.username}`).setDescription(`Select Items to give to ${user.username} with the Select Menu!`).setColor("DarkVividPink").setThumbnail(user.displayAvatarURL()).addFields({ name: `📦 Items:`, value: `${itemList.length < 1 ? `No Items Selected` : `${itemList.map((x, i) => `${x.emoji} ${x.name} (${x.type}) x ${x.amount}`).join("\n")}`}` }).setFooter({ text: `The recent item can be increasing their amount!` })], components: [amountRow, row], ephemeral: true })
                const collector = interaction.channel.createMessageComponentCollector({ time: 99999999, idle: 7000 })
                collector.on("collect", async (i) => {
                    if (i.values != null) {
                        await i?.deferUpdate()
                        var item = i.values[0].split("-")
                        var gotItems = farmerAuthor.inventory.filter((x) => x.name == item[0] && x.type == item[1])
                        if (!itemList.some((c) => c.name == item[0])) {
                            if (gotItems[0].amount > 1) amountRow.components[3].setDisabled(false)
                            if (gotItems[0].amount < 2) amountRow.components[0].setDisabled(true)
                            if (gotItems[0].amount <= defAmount) amountRow.components[3].setDisabled(true)
                            itemList.push({ name: gotItems[0].name, type: gotItems[0].type, emoji: gotItems[0].emoji, amount: defAmount })
                            await i.editReply({ embeds: [new EmbedBuilder().setTitle(`🎁 Giving items to ${user.username}`).setDescription(`Select Items to give to ${user.username} with the Select Menu!`).setColor("DarkVividPink").setThumbnail(user.displayAvatarURL()).addFields({ name: `📦 Items:`, value: `${itemList.length < 1 ? `No Items Selected` : `${itemList.map((x, i) => `${x.emoji} ${x.name} (${x.type}) x ${x.amount}`).join("\n")}`}` }).setFooter({ text: `The recent item can be increasing their amount!` })], components: [amountRow, row], ephemeral: true })
                            collector.resetTimer()
                        } else {
                            itemList = itemList.filter((c) => c.name !== item[0]);
                            if (itemList[itemList.length - 1].amount <= defAmount) amountRow.components[0].setDisabled(false)
                            if (gotItems[0].amount >= itemList[itemList.length - 1].amount) amountRow.components[3].setDisabled(true)
                            if (itemList[itemList.length - 1].amount < 2 || gotItems[0].amount < 2) amountRow.components[0].setDisabled(true)
                            await i.editReply({ embeds: [new EmbedBuilder().setTitle(`🎁 Giving items to ${user.username}`).setDescription(`Select Items to give to ${user.username} with the Select Menu!`).setColor("DarkVividPink").setThumbnail(user.displayAvatarURL()).addFields({ name: `📦 Items:`, value: `${itemList.length < 1 ? `No Items Selected` : `${itemList.map((x, i) => `${x.emoji} ${x.name} (${x.type}) x ${x.amount}`).join("\n")}`}` }).setFooter({ text: `The recent item can be increasing their amount!` })], components: [amountRow, row], ephemeral: true }); collector.resetTimer()
                        }
                    } else if (i.customId != null) {
                        await i?.deferUpdate()
                        switch (i.customId) {
                            case "redo1":
                                var getLastItem = itemList[itemList.length - 1]
                                var gotItems = farmerAuthor.inventory.filter((x) => x.name == itemList[itemList.length - 1].name && x.type == itemList[itemList.length - 1].type)
                                getLastItem.amount--
                                if (getLastItem.amount < 2) amountRow.components[0].setDisabled(true)
                                if (getLastItem.amount < gotItems[0].amount) amountRow.components[3].setDisabled(false)
                                await i.editReply({ embeds: [new EmbedBuilder().setTitle(`🎁 Giving items to ${user.username}`).setDescription(`Select Items to give to ${user.username} with the Select Menu!`).setColor("DarkVividPink").setThumbnail(user.displayAvatarURL()).addFields({ name: `📦 Items:`, value: `${itemList.length < 1 ? `No Items Selected` : `${itemList.map((x, i) => `${x.emoji} ${x.name} (${x.type}) x ${x.amount}`).join("\n")}`}` }).setFooter({ text: `The recent item can be increasing their amount!` })], components: [amountRow, row], ephemeral: true }); collector.resetTimer()
                                break;
                            case "give":
                                itemList.forEach(async (x, v) => { farmerAuthor.inventory[farmerAuthor.inventory.map(c => c.name).indexOf(x.name)].amount -= x.amount; if (farmerTarget2.inventory.some((g) => g.name == x.name && g.type == x.type)) { farmerTarget2.inventory.forEach((t) => { if (t.name == x.name && t.type == x.type) { t.amount += x.amount } }) } else { farmerTarget2.inventory.push({ name: x.name, type: x.type, emoji: x.emoji, amount: x.amount }) } })
                                farmerAuthor.inventory = farmerAuthor.inventory.filter(b => b.amount !== 0)
                                await farmer.findOneAndUpdate({ userId: farmerAuthor.userId }, { inventory: farmerAuthor.inventory })
                                await farmer.findOneAndUpdate({ userId: farmerTarget2.userId }, { inventory: farmerTarget2.inventory })
                                i.editReply({ embeds: [new EmbedBuilder().setTitle(`🎁 Item sent to ${user.username}!`).setDescription(`You just sent ${itemList.length > 1 ? `${itemList.length} Items` : `${itemList.length} Item`} to ${user.username}`).setColor("Green")], components: [] })
                                try {
                                    user.send({ embeds: [new EmbedBuilder().setTitle(`🎁 Wow, you got a gift!`).setDescription(`\`\`\`${interaction.user.username} just sent to some item(s)!\`\`\``).addFields({ name: "📦 Item Received", value: `${itemList.map((h) => `${h.emoji} ${h.name} (${h.type}) x ${h.amount}`).join("\n")}` })] })
                                } catch (error) {
                                    interaction.channel.send({ content: `${user}`, embeds: [new EmbedBuilder().setTitle(`🎁 Wow, you got a gift!`).setDescription(`\`\`\`${interaction.user.username} just sent to some item(s)!\`\`\``).addFields({ name: "📦 Item Received", value: `${itemList.map((h) => `${h.emoji} ${h.name} (${h.type}) x ${h.amount}`).join("\n")}` })] })
                                }
                                break;
                            case "cancel":
                                await i.editReply({ embeds: [new EmbedBuilder().setTitle(`❌ Process Cancelled`).setDescription(`You just cancelled the giving process`).setFooter({ text: `You can clear this message now!` }).setColor("Red")], components: [] })
                                collector.stop()
                                break;
                            case "add1":
                                var gotItems = farmerAuthor.inventory.filter((x) => x.name == itemList[itemList.length - 1].name && x.type == itemList[itemList.length - 1].type)
                                var getLastItem = itemList[itemList.length - 1]
                                getLastItem.amount++
                                if (getLastItem.amount >= gotItems[0].amount) amountRow.components[3].setDisabled(true)
                                if (getLastItem.amount > 1) amountRow.components[0].setDisabled(false)
                                await i.editReply({ embeds: [new EmbedBuilder().setTitle(`🎁 Giving items to ${user.username}`).setDescription(`Select Items to give to ${user.username} with the Select Menu!`).setColor("DarkVividPink").setThumbnail(user.displayAvatarURL()).addFields({ name: `📦 Items:`, value: `${itemList.length < 1 ? `No Items Selected` : `${itemList.map((x, i) => `${x.emoji} ${x.name} (${x.type}) x ${x.amount}`).join("\n")}`}` }).setFooter({ text: `The recent item can be increasing their amount!` })], components: [amountRow, row], ephemeral: true }); collector.resetTimer()
                                break;
                        }
                    }
                })
                collector.on("end", async (_, i) => { return })
                break;
        }
    }
}