const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("deposite")
        .setDescription("Deposite your money in your bank! Making saves is not a bad idea after all!")
        .addSubcommand(option =>
            option
                .setName("amount")
                .setDescription("Provide the amount to deposite to your bank")
                .addNumberOption(option =>
                    option
                        .setName("value")
                        .setDescription("Provide the value to deposite")
                        .setRequired(true)
                )
        )
        .addSubcommand(option =>
            option
                .setName("all")
                .setDescription("Deposite all your money to the bank!")
        ),
    async run(client, interaction) {
        const sb = interaction.options.getSubcommand()
        const value = interaction.options.getNumber("value")
        let farmers = await farmer.findOne({ userId: interaction.user.id })

        if (!farmers) return interaction.reply({ content: "You do not opened your house to continue.", ephemeral: true })

        switch (sb) {
            case "amount":
                if (value == 0) return interaction.reply({ content: `Please provide a valid value to deposite!`, ephemeral: true })
                if (value > farmers.economy.money) return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`❌ Not Enough Balance`).setDescription("\`You do not have the enough money to deposite...\`").setColor("Orange")], ephemeral: true })
                farmers.economy.money -= value; farmers.economy.bank += value
                await farmer.findOneAndUpdate({ userId: interaction.user.id }, { economy: farmers.economy })
                await interaction.deferReply({ ephemeral: true })
                interaction.followUp({ embeds: [new EmbedBuilder().setTitle(`💰 Depositing Process Successfully`).setColor("Green").addFields({ name: `👛 Balance`, value: `\`\`\`${farmers.economy.money} (-${value}) -> 💰 ${farmers.economy.bank}\`\`\`` }).setFooter({ text: `Remember, you can't make purchases when you have part of the money in your bank!` })], ephemeral: true })
                break;
            case "all":
                if (value == 0) return interaction.reply({ content: `Please provide a valid value to deposite!`, ephemeral: true })
                farmers.economy.bank += farmers.economy.money
                farmers.economy.money -= farmers.economy.money
                await farmer.findOneAndUpdate({ userId: interaction.user.id }, { economy: farmers.economy })
                await interaction.deferReply({ ephemeral: true })
                interaction.followUp({ embeds: [new EmbedBuilder().setTitle(`💰 Depositing Process Successfully`).setColor("Green").addFields({ name: `👛 Balance`, value: `\`\`\`${farmers.economy.money} -> 💰 ${farmers.economy.bank}\`\`\`` }).setFooter({ text: `Remember, you can't make purchases when you have part of the money in your bank!` })], ephemeral: true })
                break;
        }
    }
}