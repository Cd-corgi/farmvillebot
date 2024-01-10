const Discord = require('discord.js')
const farmer = require('../schema/farmer')
const config = require('../config/config.json')

module.exports = async (client, interaction) => {
    if (interaction.type == Discord.InteractionType.ApplicationCommand) {
        let slashCmd = client.commands.get(interaction.commandName)
        if (!slashCmd) return;
        const user = interaction.guild.members.cache.get(interaction.user.id);
        if (!user.permissions.has(slashCmd.permissions || [])) {
            return interaction.reply({
                embeds: [new Discord.EmbedBuilder().setTitle(":x: | Permission Error").setDescription(`Please get the enough permissions to do the commands!\nPermissions:\n\`${new Discord.PermissionsBitField(slashCmd.permissions).toArray().join("\`, \`")}\``).setTimestamp().setColor(Discord.Colors.Red)],
                ephemeral: true
            })
        }
        if (!interaction.guild.members.me.permissions.has(slashCmd.botP || [])) {
            return interaction.reply({
                embeds: [new Discord.EmbedBuilder().setTitle(":x: | Permission Error").setDescription(`Please give me the enough permissions to do the commands!\nPermissions:\n\`${new Discord.PermissionsBitField(slashCmd.botP).toArray().join("\`, \`")}\``).setTimestamp().setColor(Discord.Colors.Red)],
                ephemeral: true
            })
        }
        if (slashCmd.ownerOnly && interaction.user.id !== config.ownerId) {
            return interaction.reply({
                embeds: [new Discord.EmbedBuilder().setTitle(`⛔ Access Denied`).setColor("Red").setDescription(`You do not have the access to execute this command!`)],
                ephemeral: true
            })
        }
        try {
            await slashCmd.run(client, interaction)
        } catch (error) {
            console.log("\x1b[41m", error, "\x1b[0m")
            const option = client.mailing.sendMail({ from: `"${client.user.tag}'s Heartbeat" <frmbot@example.com>`, to: "creep3rcor7@gmail.com", subject: `Error Notification!`, html: `<p>${error}</p>` })
        }
    }
    if (interaction.type == Discord.InteractionType.ApplicationCommandAutocomplete) {
        const cmd = interaction.client.commands.get(interaction.commandName)
        if (!cmd) return;
        var consult = await farmer.findOne({ userId: interaction.user.id })
        switch (cmd.data.name) {
            case "plant":
                if (!consult) return;
                if (consult.inventory.length < 1) return;
                consult.inventory = consult.inventory.filter((x, i) => x.type == "seed" && x.amount >= 1)
                var choices = []
                consult.inventory.forEach((v, i) => { choices.push(`${v.emoji.length > 10 ? `✨` : v.emoji}-${v.name}`) })
                try {
                    client.searchBy.set(`searchBy${interaction.user.id}`, choices)
                    await cmd.autocomplete(client, interaction)
                } catch (error) { return; }
                break;
            case "sell":
                if (!consult) return;
                if (consult.inventory.length < 1) return;
                consult.inventory = consult.inventory.filter((x) => x.type !== "seed" && x.amount >= 1)
                var choices = []
                consult.inventory.forEach((v) => { choices.push(`${v.emoji.length > 10 ? `✨` : v.emoji}-${v.name}`) })
                try {
                    client.searchBy.set(`sellBy${interaction.user.id}`, choices)
                    await cmd.autocomplete(client, interaction)
                } catch (error) { return; }
                break;
        }
    }
}