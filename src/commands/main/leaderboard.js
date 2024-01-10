const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("🎖 Check your position in the global top!"),
    async run(client, interaction) {
        let getPlayers = await farmer.find({})
        let totalPlayers = []; var definitiveList = []; let Embeds = []; let limixemebd = 10
        getPlayers = getPlayers.filter((v) => (v.economy.bank + v.economy.money) > 0)
        getPlayers.forEach((x, i) => totalPlayers.push({ userId: x.userId, totalMoney: (x.economy.money + x.economy.bank) }))
        totalPlayers = totalPlayers.sort(function (a, b) { return b.totalMoney - a.totalMoney })
        for (let i = 0; i < totalPlayers.length; i++) { let getUser = await client.users.fetch(totalPlayers[i].userId); const nFormat = Intl.NumberFormat(); definitiveList.push(`${i + 1 == 1 ? `🥇 \`1\`` : i + 1 == 2 ? `🥈 \`2\`` : i + 1 == 3 ? `🥉 \`3\`` : `\`🔹 ${i + 1}\``} **${getUser.username}** 💵 \`${nFormat.format(totalPlayers[i].totalMoney)}\``) }
        for (let i = 0; i < definitiveList.length; i += limixemebd) { let users = definitiveList.slice(i, i + limixemebd); const embed = new EmbedBuilder().setThumbnail(client.user.displayAvatarURL()).setTitle(`📦 Global Leaderboard`).setDescription(users.join('\n')).setColor("Red"); Embeds.push(embed) }
        const row = new Discord.ActionRowBuilder().addComponents(new Discord.ButtonBuilder().setCustomId("redo").setLabel("< Redo").setStyle(Discord.ButtonStyle.Secondary)).addComponents(new Discord.ButtonBuilder().setCustomId("finish").setLabel("End Interaction").setStyle(Discord.ButtonStyle.Danger)).addComponents(new Discord.ButtonBuilder().setCustomId("forw").setLabel("Next >").setStyle(Discord.ButtonStyle.Secondary))
        if (Embeds.length < 2) {
            row.components[0].setDisabled(true); row.components[1].setDisabled(true); row.components[2].setDisabled(true)
            return interaction.reply({ embeds: [Embeds[0].setFooter({ text: `${totalPlayers.length} Players Ranked!` })], components: [row] })
        }
        var curPage = 0
        row.components[0].setDisabled(true)
        let msg = await interaction.reply({ embeds: [Embeds[curPage].setFooter({ text: `${totalPlayers.length} Players Ranked!` })], components: [row] })
        const filter = (i) => i.user.id === interaction.user.id
        const collector = interaction.channel.createMessageComponentCollector({ time: 60000, idle: 10000, filter, componentType: Discord.ComponentType.Button })
        collector.on("collect", async (i) => {
            await i?.deferUpdate()
            switch (i.customId) {
                case "redo":
                    curPage--
                    if (curPage !== Embeds.length - 1) row.components[2].setDisabled(false)
                    if (curPage < 1) row.components[0].setDisabled(true)
                    i.editReply({ embeds: [Embeds[curPage].setFooter({ text: `${totalPlayers.length} Players Ranked!` })], components: [row] })
                    collector.resetTimer()
                    break;
                case "finish":
                    i.editReply({ components: [] })
                    collector.stop()
                    break;
                case "forw":
                    curPage++
                    if (curPage !== 0) row.components[0].setDisabled(false)
                    if (curPage === Embeds.length - 1) row.components[2].setDisabled(true)
                    i.editReply({ embeds: [Embeds[curPage].setFooter({ text: `${totalPlayers.length} Players Ranked!` })], components: [row] })
                    collector.resetTimer()
                    break;
            }
        })

        collector.on("end", async (_, reason) => {
            if (reason == "user" || reason == "time") {
                try {
                    interaction.editReply({ components: [] })
                    return;
                } catch (error) { }
            } else {
                try {
                    interaction.editReply({ components: [] })
                    return;
                } catch (error) { }
            }
        })
    }
}