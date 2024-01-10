const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Discord = require('discord.js')
const moment = require('moment')
const seed = require('../../config/seeds.json')
const farmer = require('../../schema/farmer')
const effects = require('../../dictionary/usage.json')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("plant")
        .setDescription("🌱 Sow seeds to be able to obtain your product")
        .addStringOption(option =>
            option
                .setName("seeds")
                .setDescription("Choose the seed to sow!")
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async autocomplete(client, interaction) {
        let choice = Array.from(client.searchBy.get(`searchBy${interaction.user.id}`))
        const getFocus = interaction.options.getFocused(true)
        choice = choice.filter(choice => choice.includes(getFocus.value))
        if (choice.length > 25) choice = choice.slice(0, 25);
        await interaction.respond(choice.map(choice => ({ name: choice, value: choice.split("-")[1].toLowerCase() })))
    },
    async run(client, interaction) {
        let getData;
        const ss = interaction.options.getString("seeds")
        let getFInfo = await farmer.findOne({ userId: interaction.user.id })
        if (!getFInfo) return interaction.reply({ content: `You do not have any profile... open your house for it.`, ephemeral: true })
        if (getFInfo.cooldowns.some((v) => v.name == "Planting")) return interaction.reply({ content: `Hold up! Leave few seconds to plant again!`, ephemeral: true })
        if (getFInfo.plotsSlot.length >= 3) return interaction.reply({ content: `Your plots are using already...`, ephemeral: true })
        let msg = await interaction.reply({ content: `Planting \`${ss}\` ...` })
        let current = Date.parse(moment(new Date()))
        let cld = Date.parse(moment(new Date()))
        seed.forEach(async (x, i) => {
            if (x.name.toLowerCase() == ss) {
                return getFInfo.inventory.forEach(async (y, i) => {
                    if (ss == x.name.toLowerCase() && y.name.toLowerCase() == ss.toLowerCase() && y.type == "seed") {
                        if (getFInfo.cooldowns.length > 0) { let dfTime = x.time2claim; getFInfo.cooldowns.forEach((b, i) => { if (b.name == "Time Reduction" || b.name == "Time Acceleration" || b.name == "Fertilized") { var getEffectInfo = effects.effect[effects.items.map((v) => v.itemName).indexOf(b.item)].values; x.time2claim -= Math.floor(x.time2claim * (getEffectInfo * 100) / 100) } }); if (dfTime !== x.time2claim) { getData = moment(current).add(x.time2claim, 'ms') } else { getData = moment(current).add(dfTime, 'ms') } } else { getData = moment(current).add(x.time2claim, 'ms') }
                        y.amount -= x.unitsXSlot
                        if (y.amount < 1) { getFInfo.inventory = getFInfo.inventory.filter((v) => v.amount >= 1) }
                        cld = Date.parse(moment(cld).add(1, "second"))
                        getFInfo.cooldowns.push({ name: `Planting`, emoji: `🌿`, time: cld })
                        getFInfo.plotsSlot.push({ plotSlot: getFInfo.plotsSlot.length, plant: y.name, emoji: y.emoji, timeLimit: getData })
                        await farmer.findOneAndUpdate({ userId: interaction.user.id }, { inventory: getFInfo.inventory, plotsSlot: getFInfo.plotsSlot, cooldowns: getFInfo.cooldowns })
                        setTimeout(async () => {
                            getFInfo = await farmer.findOne({ userId: interaction.user.id })
                            interaction.editReply({ content: "", embeds: [new EmbedBuilder().setTitle(`${y.emoji} ${y.name} Have been planted!`).setDescription(`**Plots remaining**: \`${3 - getFInfo.plotsSlot.length}\`\n**Selected Seed**: ${y.emoji} \`${y.name}\`\n**Estimated Time**: <t:${Math.floor(getFInfo.plotsSlot[getFInfo.plotsSlot.length - 1].timeLimit / 1000)}:R>`)] }).then(() => setTimeout(() => interaction.deleteReply(), 7000)).catch((error) => { })
                            client.searchBy.delete(`searchBy${interaction.user.id}`)
                        }, 5000);
                    }
                })
            }
        })
    }
}