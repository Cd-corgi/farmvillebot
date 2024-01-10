const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Discord = require('discord.js')
const redeem = require('../../dictionary/redeeem.json')
const farm = require('../../schema/farmer')
const { giveListItem } = require('../../utils/functions')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("redeem")
        .setDescription("You can redeem a promotion code! only once time when you claim one!")
        .addStringOption(option =>
            option
                .setName("code")
                .setDescription(`Put a valid promotion code!`)
                .setRequired(true)
        ),
    async run(client, interaction) {
        const code = interaction.options.getString("code")
        let getFarmer = await farm.findOne({ userId: interaction.user.id })
        if (!getFarmer) return interaction.reply({ content: `You have not your house openned to use this command!`, ephemeral: true })
        if (redeem[code] == undefined || redeem[code] == null) return interaction.reply({ content: `This code couldn't be found, or is not valid!`, ephemeral: true })
        if (getFarmer.RdmCodes.some((x) => x == code)) return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`❌ Code Redeemed Already`).setDescription(`You already redeemed this code! Try with a new code!`).setColor("Red")], ephemeral: true })
        getFarmer.RdmCodes.push(code)
        var codeRwd = redeem[code]
        await giveListItem(codeRwd.items, getFarmer)
        getFarmer.economy.money += codeRwd.money
        await farm.findOneAndUpdate({ userId: interaction.user.id }, { RdmCodes: getFarmer.RdmCodes, economy: getFarmer.economy })
        await interaction.deferReply({ ephemeral: true })
        interaction.followUp({
            embeds: [
                new EmbedBuilder()
                    .setTitle("🎁 You just redeemed something")
                    .setDescription("Congratulations! You just redeemed a code that it contains...")
                    .addFields({ name: `🎁 Rewards`, value: `${ codeRwd.money > 0 ? `💵 \`Money\` x ${codeRwd.money}\n${codeRwd.items.map((x) => `${x.emoji} \`${x.item}\` (${x.type}) x ${x.amount}`).join("\n")}` : `${codeRwd.items.map((x) => `${x.emoji} \`${x.item}\` (${x.type}) x ${x.amount}`).join("\n")}` }` })
                    .setImage("https://media.giphy.com/media/JTtDBlIeAXbaAJDUXq/giphy.gif")
                    .setColor("DarkGold")
            ]
        })
    }
}