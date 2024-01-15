const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Discord = require('discord.js')
const items = require('../../config/items.json')
const { giveAllPlayers } = require('../../utils/filters')
const { sendAlarm } = require('../../utils/functions')
module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    ownerOnly: true,
    data: new SlashCommandBuilder()
        .setName("morpheus")
        .setDefaultMemberPermissions(0)
        .setDescription("Little Great Morpheus 🌛 Give them luck for those users")
        .addStringOption(option =>
            option
                .setName("item")
                .setDescription("Give items to the users!")
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addNumberOption(option =>
            option
                .setName("amount")
                .setDescription("Give an amount of the item that you want to give!")
                .setRequired(true)
        ),
    async autocomplete(client, interaction) {
        var choice = Array.from(client.searchBy.get(`giveEvent${interaction.user.id}`))
        const focus = await interaction.options.getFocused(true)
        choice = choice.filter((v) => v.includes(focus.value))
        if (choice.length > 25) choice = choice.splice(0, 25)
        await interaction.respond(choice.map((choice) => ({ name: choice, value: choice.split("-").slice(1).join("-") })))
    },
    async run(client, interaction) {
        client.searchBy.delete(`giveEvent${interaction.user.id}`)
        const cho = interaction.options.getString("item")
        const am = interaction.options.getNumber("amount")
        let idx = cho.split("-")
        let getItem = items[idx[1]]
        var detectedItem = items[idx[1]][getItem.map((x) => x.name).indexOf(idx[0])]
        const row = new Discord.ActionRowBuilder().addComponents(new Discord.ButtonBuilder().setLabel("Yes").setStyle(Discord.ButtonStyle.Success).setCustomId("y")).addComponents(new Discord.ButtonBuilder().setLabel("No").setStyle(Discord.ButtonStyle.Danger).setCustomId("n"))
        let msg = await interaction.reply({ embeds: [new EmbedBuilder().setTitle("🌛 Morpheus' Wish").setDescription(`You are about to send x ${am} of ${detectedItem.emoji} \`${detectedItem.name}\`\n\nAre you sure?`).setColor("DarkNavy")], components: [row], ephemeral: true })
        const collector = await interaction.channel.createMessageComponentCollector({ componentType: Discord.ComponentType.Button })
        collector.on("collect", async i => {
            await i?.deferUpdate()
            switch (i.customId) {
                case "y":
                    i.editReply({ components: [], embeds: [new EmbedBuilder().setTitle(`✨🌛 Morpheus's Wish have been sent!`).setDescription(`All the players will have their wishes came true!`).setColor("Green")] })
                    await giveAllPlayers(detectedItem, am)
                    await sendAlarm(client, detectedItem, am)
                    collector.stop()
                    break;
                case "n":
                    i.editReply({ components: [], embeds: [new EmbedBuilder().setTitle(`✨🌛 Morpheus's Wish have been cancelled!`).setDescription(`You rejected the morpheus's wish!`).setColor("Green")] })
                    collector.stop()
                    break;
            }
        })
    }
}