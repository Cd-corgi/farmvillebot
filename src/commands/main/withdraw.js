const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')

module.exports = {
    permissions: [PermissionFlagsBits.SendMessages],
    botP: [PermissionFlagsBits.SendMessages],
    data: new SlashCommandBuilder()
        .setName("withdraw")
        .setDescription("Extract your money deposited in your bank!")
        .addSubcommand(option =>
            option
                .setName("amount")
                .setDescription("Provide the amount to withdraw to your wallet")
                .addNumberOption(option =>
                    option
                        .setName("value")
                        .setDescription("Provide the value to withdraw")
                        .setRequired(true)
                )
        )
        .addSubcommand(option =>
            option
                .setName("all")
                .setDescription("Withdraw all your money from the bank!")
        ),
    async run(client, interaction) {
        const sb = interaction.options.getSubcommand()
        const value = interaction.options.getNumber("value")
        let farmers = await farmer.findOne({ userId: interaction.user.id })

        if (!farmers) return interaction.reply({ content: "You do not opened your house to continue.", ephemeral: true })

        switch (sb) {
            case "amount":
                if (value == 0) return interaction.reply({ content: `Please provide a valid value to withdraw!`, ephemeral: true })
                if (value > farmers.economy.bank) return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`❌ Not Enough Balance`).setDescription("\`You do not have the enough money to deposite...\`").setColor("Orange")], ephemeral: true })
                farmers.economy.money += value; farmers.economy.bank -= value
                await farmer.findOneAndUpdate({ userId: interaction.user.id }, { economy: farmers.economy })
                await interaction.deferReply({ ephemeral: true })
                interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`💰 Withdraw Process Successfully`)
                            .setColor("Green")
                            .addFields({ name: `👛 Balance`, value: `\`\`\`${farmers.economy.money} <- (+${value}) 💰 ${farmers.economy.bank}\`\`\`` })
                            .setFooter({ text: `Remember, Your money is in your wallet, it means that can be exposed to be robbed. Be careful` })
                    ],
                    ephemeral: true
                })
                break;
            case "all":
                if (value == 0) return interaction.reply({ content: `Please provide a valid value to deposite!`, ephemeral: true })
                farmers.economy.money += farmers.economy.bank
                farmers.economy.bank -= farmers.economy.bank
                await farmer.findOneAndUpdate({ userId: interaction.user.id }, { economy: farmers.economy })
                await interaction.deferReply({ ephemeral: true })
                interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`💰 Withdraw Process Successfully`)
                            .setColor("Green")
                            .addFields({ name: `👛 Balance`, value: `\`\`\`${farmers.economy.money} <- 💰 ${farmers.economy.bank}\`\`\`` })
                            .setFooter({ text: `Remember, Your money is in your wallet, it means that can be exposed to be robbed. Be careful` })
                        ],
                    ephemeral: true
                })
                break;
        }
    }
}