const Discord = require('discord.js')
const seeds = require('../config/seeds.json')
const farmer = require('../schema/farmer')
const crate = require('../dictionary/boxes.json')
const { clearFilter, prepareFilter } = require('./filters'); const moment = require('moment'); const items = require('../config/items.json')

module.exports = {
    houseId() {
        let finalCode = ""
        var ChrMap = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        for (let i = 0; i < 8; i++) {
            var getChr = ChrMap[Math.floor(Math.random() * ChrMap.length)]
            if (typeof getChr == "string") {
                var getCh = Math.floor(Math.random() * 1)
                if (getCh == 1) {
                    getChr = getChr.toUpperCase()
                } else {
                    getChr = getChr.toLowerCase()
                }
            }
            finalCode += getChr
        }
        return finalCode
    },
    rangeNumber(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    },
    async createPagination(client, interaction, Embeds, rows, controlRow = null) {
        i = 0
        if (Embeds.length < 2) {
            let msg = await interaction.reply({ embeds: [Embeds[i].setFooter({ text: `${i + 1} / ${Embeds.length}` })] })
            return
        }
        let msg = await interaction.reply({ embeds: [Embeds[i].setFooter({ text: `${i + 1} / ${Embeds.length}` })], components: controlRow != null ? [controlRow, rows] : [rows] })
        let filter = (i) => i.user.id == interaction.user.id
        const collector = interaction.channel.createMessageComponentCollector({ idle: 6000, time: 90000, componentType: Discord.ComponentType.Button, filter })

        collector.on("collect", async (x) => {
            await x.deferUpdate()
            switch (x.customId) {
                case "redo":
                    if (i !== 0) {
                        i--
                        x.editReply({ embeds: [Embeds[i].setFooter({ text: `${i + 1} / ${Embeds.length}` })], components: [controlRow != null ? controlRow : null, rows] })
                    } else {
                        i = Embeds.length - 1
                        x.editReply({ embeds: [Embeds[i].setFooter({ text: `${i + 1} / ${Embeds.length}` })], components: [controlRow != null ? controlRow : null, rows] })
                    }
                    collector.resetTimer()
                    break;
                case "frwd":
                    if (i < Embeds.length - 1) {
                        i++
                        rows.components[1].setDisabled(false)
                        rows.components[0].setDisabled(false)
                        x.editReply({ embeds: [Embeds[i].setFooter({ text: `${i + 1} / ${Embeds.length}` })], components: [controlRow != null ? controlRow : null, rows] })
                    } else {
                        i = 0
                        x.editReply({ embeds: [Embeds[i].setFooter({ text: `${i + 1} / ${Embeds.length}` })], components: [controlRow != null ? controlRow : null, rows] })
                    }
                    collector.resetTimer()
                    break;
            }
            if (controlRow !== null || controlRow !== undefined) {
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
                            console.log(totalMoney)
                            farm.economy.money += totalMoney
                            await farmer.findOneAndUpdate({ userId: x.user.id }, { economy: farm.economy, basket: farm.basket })
                            await x.deferUpdate()
                            x.editReply({ content: ``, embeds: [new Discord.EmbedBuilder().setTitle(`📦 Billing Registry`).setDescription(outPut.substring(1, 2048)).setThumbnail(interaction.user.displayAvatarURL()).setColor("Green").setTimestamp().addFields({ name: "Total:", value: `💵 \`${totalMoney}\`` })] }).then(() => setTimeout(() => x.deleteReply(), 10000))
                            collector.stop()
                        }, 5000)
                        break;
                    case "keep":
                        x.editReply({ content: `📥 Collecting ...`, embeds: [], components: [] })
                        setTimeout(async () => {
                            let ff = await farmer.findOne({ userId: x.user.id })
                            ff.basket.forEach((v) => {
                                if (ff.inventory.some((z) => z.name.toLowerCase() == v.product.toLowerCase() && z.type == "products")) {
                                    ff.inventory.forEach((a, b) => { if (a.name == v.product && a.type == "products") a.amount += v.amount })
                                } else { ff.inventory.push({ name: `${v.product}`, type: "products", emoji: `${v.emoji}`, amount: v.amount }) }
                                ff.basket = ff.basket.filter((g) => g.product !== v.product)
                            })
                            await farmer.findOneAndUpdate({ userId: x.user.id }, { basket: ff.basket, inventory: ff.inventory })
                            x.editReply({ content: ``, embeds: [new Discord.EmbedBuilder().setTitle(`🗃 Collecting Products`).setDescription(`\`All your products are saved in your inventory! Check them.\``).setColor("Green")] }).then(() => setTimeout(() => x.deleteReply(), 5000)).catch((error) => { })
                            collector.stop()
                        }, 5000)
                        break;
                }
            }
        })

        collector.on("end", (col, reason) => { if (reason == "time") { interaction.editReply({ components: [] }); return; } else if (reason == "idle") { return; } })
    },
    async createInventoryPages(client, interaction, Embeds, rows, filterRow) {
        if (Embeds.length < 2) {
            await interaction.deferReply({ ephemeral: true })
            return interaction.followUp({ embeds: [Embeds[0]] })
        }
        let curPage = 0
        let msg = await interaction.reply({ embeds: [Embeds[curPage].setFooter({ text: `${curPage + 1} / ${Embeds.length}` })], components: [filterRow, rows], ephemeral: true })
        const collection = interaction.channel.createMessageComponentCollector({ time: 60000, idle: 7000 })
        collection.on("collect", async i => {
            await i.deferUpdate()
            switch (i.componentType) {
                case 2:
                    switch (i.customId) {
                        case "redo":
                            if (curPage != 0) {
                                curPage--
                                i.editReply({ embeds: [Embeds[curPage].setFooter({ text: `${curPage + 1} / ${Embeds.length}` })], components: [filterRow, rows], ephemeral: true })
                            } else {
                                curPage = Embeds.length - 1;
                                i.editReply({ embeds: [Embeds[curPage].setFooter({ text: `${curPage + 1} / ${Embeds.length}` })], components: [filterRow, rows], ephemeral: true })
                            }
                            break;
                        case "clsf":
                            let farmers = await farmer.findOne({ userId: i.user.id })
                            let items = []
                            let limitXEmbed = 6
                            for (let i = 0; i < farmers.inventory.length; i += limitXEmbed) {
                                let item = farmers.inventory.slice(i, i + limitXEmbed)
                                item.map((x) => items.push({ name: `${x.emoji} ${x.name}`, value: `${x.type} x${x.amount}`, inline: true }))
                            }
                            Embeds = []
                            for (let i = 0; i < farmers.inventory.length; i += limitXEmbed) {
                                let item = items.slice(i, i + limitXEmbed)
                                const embed = new Discord.EmbedBuilder().setTitle(`🎒 Inventory`).setThumbnail(interaction.user.displayAvatarURL()).addFields(item).setColor("Green")
                                Embeds.push(embed)
                            }
                            curPage = 0
                            rows.components[1].setDisabled(true)
                            if (Embeds.length < 2) {
                                rows.components[0].setDisabled(true)
                                rows.components[2].setDisabled(true)
                            } else {
                                rows.components[0].setDisabled(false)
                                rows.components[2].setDisabled(false)
                            }
                            i.editReply({ embeds: [Embeds[curPage].setFooter({ text: `${curPage + 1} / ${Embeds.length}` })], components: [filterRow, rows], ephemeral: true })
                            break;
                        case "frwd":
                            if (curPage < Embeds.length - 1) {
                                curPage++
                                i.editReply({ embeds: [Embeds[curPage].setFooter({ text: `${curPage + 1} / ${Embeds.length}` })], components: [filterRow, rows], ephemeral: true })
                            } else {
                                curPage = 0
                                i.editReply({ embeds: [Embeds[curPage].setFooter({ text: `${curPage + 1} / ${Embeds.length}` })], components: [filterRow, rows], ephemeral: true })
                            }
                            break;
                    }
                    collection.resetTimer()
                    break;
                case 3:
                    rows.components[1].setDisabled(false)
                    let getUpdateItems = await farmer.findOne({ userId: i.user.id })
                    getUpdateItems.inventory = getUpdateItems.inventory.filter((v) => v.type == i.values[0])
                    if (getUpdateItems.inventory.length < 1) {
                        i.editReply({ embeds: [new Discord.EmbedBuilder().setColor("Red").setDescription(`❌ There's no item with this type! Clearing Filter...`)], components: [], ephemeral: true })
                        setTimeout(async () => {
                            Embeds = await clearFilter(client, i, Embeds);
                            curPage = 0
                            rows.components[1].setDisabled(true)
                            i.editReply({ embeds: [Embeds[curPage].setFooter({ text: `${curPage + 1} / ${Embeds.length}` })], components: [filterRow, rows], ephemeral: true })
                            collection.resetTimer()
                        }, 3000)
                    } else {
                        curPage = 0;
                        Embeds = await prepareFilter(getUpdateItems.inventory, 6, interaction)
                        if (Embeds.length < 2) { rows.components[0].setDisabled(true); rows.components[2].setDisabled(true) }
                        i.editReply({ embeds: [Embeds[curPage].setFooter({ text: `${curPage + 1} / ${Embeds.length}` })], components: [filterRow, rows], ephemeral: true })
                        collection.resetTimer()
                    }
                    break;
            }
        })
        collection.on("end", async (_, reason) => { return; })
    },
    async loadEmbeds(limitXEmbed, consult, embed) {
        let items = []
        for (let i = 0; i < consult.length; i += limitXEmbed) {
            let getI = consult.slice(i, i + limitXEmbed)
            getI.map((x) => items.push({ name: `${x.emoji} \`${x.name}\``, value: `💵 \`${x.price}\` ${x.lastSeller == null ? `| ${x.type}` : ` | x ${x.stock}`}`, inline: true }))
        }
        let embeds = []
        for (let i = 0; i < consult.length; i += limitXEmbed) {
            let getItems = items.slice(i, i + limitXEmbed)
            embed.addFields(getItems)
            embeds.push(embed)
        }
        return embeds
    },
    async giveDailyItems(farmers, itemList) {
        for (let i = 0; i < itemList.length; i++) {
            if (itemList[i].type == null) {
                farmers.economy.money += itemList[i].amount
            } else {
                if (farmers.inventory.some((v) => v.name.toLowerCase() == itemList[i].name.toLowerCase() && v.type == itemList[i].type)) {
                    farmers.inventory.forEach((x) => { if (x.name.toLowerCase() == itemList[i].name.toLowerCase() && x.type == itemList[i].type) { x.amount += itemList[i].amount } })
                } else {
                    farmers.inventory.push({ name: itemList[i].name, emoji: itemList[i].emoji, type: itemList[i].type, amount: itemList[i].amount })
                }
            }
        }
        let getTime = Date.parse(moment(new Date()))
        getTime = moment(getTime).add(86400000, 'ms')
        farmers.cooldowns.push({ name: "Daily", emoji: "📦", time: getTime })
        await farmer.findOneAndUpdate({ userId: farmers.userId }, { economy: farmers.economy, cooldowns: farmers.cooldowns, inventory: farmers.inventory })
    },
    async getRarrity(probability = Number) {
        let result = ""
        if (probability >= 99 && probability <= 100) {
            result = "Guaranted"
        } else if (probability >= 75 && probability <= 98) {
            result = "Common"
        } else if (probability >= 50 && probability <= 74) {
            result = "Uncommon"
        } else if (probability >= 25 && probability <= 49) {
            result = "Rare"
        } else if (probability >= 10 && probability <= 24) {
            result = "Very Rare"
        } else if (probability >= 5 && probability <= 9) {
            result = "Impossible"
        } else if (probability >= 0.1 && probability <= 4) {
            result = "Unique"
        }
        return result
    },
    validItems(itemData) {
        switch (itemData.type) {
            case "seed":
                if (!items.seed.some((v) => v.name == itemData.name)) return null
                var getItemData = items.seed[items.seed.map((v) => v.name).indexOf(itemData.name)]
                return getItemData
            case "tool":
                if (!items.tool.some((v) => v.name == itemData.name)) return null
                var getItemData = items.tool[items.tool.map((v) => v.name).indexOf(itemData.name)]
                return getItemData
            case "misc":
                if (!items.misc.some((v) => v.name == itemData.name)) return null
                var getItemData = items.misc[items.misc.map((v) => v.name).indexOf(itemData.name)]
                return getItemData
            case "products":
                if (!items.products.some((v) => v.name == itemData.name)) return null
                var getItemData = items.products[items.products.map((v) => v.name).indexOf(itemData.name)]
                return getItemData
            case "token":
                if (!items.tokens.some((v) => v.name == itemData.name)) return null
                var getItemData = items.tokens[items.tokens.map((v) => v.name).indexOf(itemData.name)]
                return getItemData
        }
    },
    ruleta(items) {
        let total = 0
        for (let i of items) {
            total += Number(i.probability)
        }
        let random = Math.random() * total;
        let acum = 0
        for (let obj of items) {
            acum += obj.probability
            if (random <= acum) {
                return obj
            }
        }
    },
    async givingItems(gg, user) {
        // console.log(gg)
        if (gg.item == "Money") {
            user.economy.money += gg.amount
            await farmer.findOneAndUpdate({ userId: user.userId }, { economy: user.economy })
            return
        } else if (user.inventory.some((v) => v.name == gg.item && v.type == gg.type)) {
            user.inventory.forEach((x, i) => {
                if (x.type == gg.type && x.item == gg.item) {
                    x.amount += gg.amount
                }
            })
        } else {
            user.inventory.push({ name: gg.item, type: gg.type, emoji: gg.emoji, amount: gg.amount })
        }
        await farmer.findOneAndUpdate({ userId: user.userId }, { inventory: user.inventory })
    },
    async giveListItem(list, user) {
        list.forEach(async (content, idx) => {
            if (content.item == "Money") {
                user.economy.money += content.amount
                await farmer.findOneAndUpdate({ userId: user.userId }, { economy: user.economy })
            } else {
                if (user.inventory.some((e) => e.name == content.item && e.type == content.type)) {
                    user.inventory.map((m, id) => { if (m.name == content.item && m.type == content.type) { m.amount += content.amount } })
                } else {
                    user.inventory.push({ name: content.item, type: content.type, emoji: content.emoji, amount: content.amount })
                }
            }
        })
        await farmer.findOneAndUpdate({ userId: user.userId }, { inventory: user.inventory })
        // user.inventory.forEach(async (x, i) => {
        // console.log(list[idx])
        // if (list[idx].item == "Money") { user.economy.money += list[idx].amount; idx++; await farmer.findOneAndUpdate({ userId: user.userId }, { economy: user.economy }) }
        // if (user.inventory.some(c => c.name == list[idx].item && c.type == list[idx].type)) {
        //     if (list[idx].item == x.name && list[idx].type == x.type) { x.amount += list[idx].amount }
        //     idx++
        // } else {
        //     user.inventory.push({ name: list[idx].item, type: list[idx].type, emoji: list[idx].emoji, amount: list[idx].amount })
        //     idx++
        // }
        // idx += 1
        // })
    },
    async eventFallingStar(user, client, msg) {
        let getfarmer = await farmer.findOne({ userId: user })
        if (!getfarmer) return;
        let prob = Math.floor(Math.random() * 100)
        if (prob <= 25) {
            let seeds = ['Diamond Fruit', 'Emerald Fruit', 'Amber Fruit', 'Ruby Fruit']
            var getSeedInfo = items.seed[items.seed.map((c) => c.name).indexOf(seeds[Math.floor(Math.random() * (seeds.length - 1))])]
            let mm = await client.channels.cache.get(msg).send({ content: `${client.users.cache.get(user)}`, embeds: [new Discord.EmbedBuilder().setTitle(`✨ The Falling Star gives you a little present!`).setDescription(`The Shooting Star just got fragmented and something lands in your hands... They are seeds!`).setImage("https://media.giphy.com/media/fBbrOyzyUFLDq/giphy.gif")] })
            setTimeout(async () => {
                mm.edit({ embeds: [new Discord.EmbedBuilder().setTitle(`✨ Special Seed`).setDescription(`You got from the Shooting Star the following item(s):\n\n> ${getSeedInfo.emoji} \`${getSeedInfo.name}\` x 1`)] }).then((c) => setTimeout(() => c.delete(), 5000)).catch((error) => { })
                if (getfarmer.inventory.some((v) => v.name == getSeedInfo.name && v.type == getSeedInfo.type)) {
                    getfarmer.inventory.forEach((c, b) => { if (c.name == getSeedInfo.name && c.type == getSeedInfo.type) { return c.amount += 1 } })
                } else {
                    getfarmer.inventory.push({ name: getSeedInfo.name, type: getSeedInfo.type, emoji: getSeedInfo.emoji, amount: 1 })
                }
                await farmer.findOneAndUpdate({ userId: user }, { inventory: getfarmer.inventory })
            }, 4500)
        }
        if (prob >= 25 && prob <= 65) {
            let ss = ['Diamond Fruit', 'Emerald Fruit', 'Amber Fruit', 'Ruby Fruit']
            var plant = seeds[seeds.map((v) => v.name).indexOf(ss[Math.floor(Math.random() * (ss.length - 1))])]
            client.channels.cache.get(msg).send({ content: `${client.users.cache.get(user)}`, embeds: [new Discord.EmbedBuilder().setTitle(`✨ Unexpected Event!`).setDescription(`The Shooting Star just got redirected directly to one of your plots...\n\nOne of your plots have been destroyed and replaced by a strange seed...`).setImage("https://media.giphy.com/media/ZXMlDKOtuJmKI/giphy.gif")] })
            if (getfarmer.plotsSlot.length > 0) {
                var replacePlot = getfarmer.plotsSlot.map((v) => v.plant).indexOf(getfarmer.plotsSlot[Math.floor(Math.random() * (getfarmer.plotsSlot.length - 1))].plant)
                getfarmer.plotsSlot = getfarmer.plotsSlot.filter((v) => v.plant !== getfarmer.plotsSlot[replacePlot].plant)
                let getCurTime = Date.parse(moment(new Date()))
                getCurTime = Date.parse(moment(getCurTime).add(plant.time2claim))
                getfarmer.plotsSlot.push({ plotSlot: getfarmer.plotsSlot.length, plant: plant.name, emoji: plant.emoji, timeLimit: getCurTime })
                return await farmer.findOneAndUpdate({ userId: user }, { plotsSlot: getfarmer.plotsSlot })
            } else {
                let getCurTime = Date.parse(moment(new Date()))
                getCurTime = Date.parse(moment(getCurTime).add(plant.time2claim))
                getfarmer.plotsSlot.push({ plotSlot: getfarmer.plotsSlot.length, plant: plant.name, emoji: plant.emoji, timeLimit: getCurTime })
                return await farmer.findOneAndUpdate({ userId: user }, { plotsSlot: getfarmer.plotsSlot })
            }
        }
        if (prob >= 65 && prob <= 100) {
            client.channels.cache.get(msg).send({ content: `${client.users.cache.get(user)}`, embeds: [new Discord.EmbedBuilder().setThumbnail("https://media.giphy.com/media/IdsBHeqRIzASVBihsa/giphy.gif").setTitle(`✨ The Falling Star just passed away`).setDescription(`The star was not the special one to give you a wish...\nI hope you can get a new chance ♥`).setColor("Red")] })
        }

    },
    async generateCrateLoot(item) {
        var itemList = []
        if (item.name === "Old Box") {
            for (let i = 0; i < 2; i++) {
                let getI = crate.OldBox[Math.floor(Math.random() * (crate.OldBox.length - 1))]
                itemList.push(getI)
            }
            return itemList
        }
        if (item.name === "Wooden Crate") {
            for (let i = 0; i < 4; i++) {
                let getI = crate.WoodenCrate[Math.floor(Math.random() * (crate.WoodenCrate.length - 1))]
                itemList.push(getI)
            }
            return itemList
        }
        if (item.name === "Old Shipment Crate") {
            for (let i = 0; i < 6; i++) {
                let getI = crate.OldShipmentCrate[Math.floor(Math.random() * (crate.OldShipmentCrate.length - 1))]
                itemList.push(getI)
            }
            return itemList
        }
        if (item.name === "Magical Colorful Box") {
            for (let i = 0; i < crate.MagicalColorfulBox.length; i++) {
                itemList.push(crate.MagicalColorfulBox[i])
            }
            return itemList
        }
    },
    async checkRecipes(itemCraft, user) {
        var checked = true
        for (let i = 0; i < itemCraft.recipe.length; i++) {
            if (!user.inventory.some((x) => x.name == itemCraft.recipe[i].name && x.type == itemCraft.recipe[i].type && x.amount >= itemCraft.recipe[i].amount)) {
                checked = false
                return checked
            }
        }
        return checked
    },
}