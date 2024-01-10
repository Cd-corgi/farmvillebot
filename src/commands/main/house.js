const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, } = require("discord.js");
const Discord = require("discord.js");
const farm = require("../../schema/farmer");
const { houseId } = require("../../utils/functions");

module.exports = {
  permissions: [PermissionFlagsBits.SendMessages],
  botP: [PermissionFlagsBits.SendMessages],
  data: new SlashCommandBuilder()
    .setName("home")
    .setDescription("Check your statistics as a farmer profile")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("(Optional) Check user's Farmer tag")
    ),
  async run(client, interaction) {
    const member = interaction.options.getUser("user");
    let consult;
    if (!member) {
      consult = await farm.findOne({ userId: interaction.user.id });
      if (!consult) {
        await interaction.reply("Loading info ...");
        let getH = houseId();
        interaction.editReply(`🏠 Opening your brand new home...`);
        new farm({ userId: interaction.user.id, houseId: `${getH}` }).save();
        setTimeout(async () => {
          consult = await farm.findOne({ userId: interaction.user.id });
          await interaction.editReply({ content: "✅ Congratulation! Your house is now open. Let's farm.", embeds: [new Discord.EmbedBuilder().setTitle(`${interaction.user.username.endsWith("s") ? `${interaction.user.username}'` : `${interaction.user.username}'s`} Farmer tag`).addFields({ name: "🏠 House ID", value: `\`${getH}\``, inline: true, }, { name: "💲 Money", value: `💵 \`${consult.economy.money}\``, inline: true, }, { name: "💰 Bank", value: `💵 \`${consult.economy.bank}\``, inline: true, }).setThumbnail(interaction.user.displayAvatarURL()).setColor("Green")], });
        }, 5000);
        return;
      }
      const nFormat = Intl.NumberFormat()

      let info = new Discord.EmbedBuilder().setTitle(`${interaction.user.username.endsWith("s") ? `${interaction.user.username}'` : `${interaction.user.username}'s`} Farmer tag`).addFields({ name: "🏠 House ID", value: `\`${consult.houseId}\``, inline: true, }, { name: "👛 Money", value: `💵 \`${nFormat.format(consult.economy.money)}\``, inline: true, }, { name: "💰 Bank", value: `💵 \`${nFormat.format(consult.economy.bank)}\``, inline: true, }).setThumbnail(interaction.user.displayAvatarURL()).setColor("Green")
      if (consult.cooldowns.length > 0) {
        let getData = ""
        for (let i = 0; i < consult.cooldowns.length; i++) { getData += `> ${consult.cooldowns[i].emoji} \`${consult.cooldowns[i].name}\` <t:${Math.floor(consult.cooldowns[i].time / 1000)}:R>\n` } info.addFields({ name: "⌛ Cooldowns", value: `${getData}` })
      }
      if (consult.plotsSlot.length >= 1) {
        let getSlots = ""
        for (const plants of consult.plotsSlot) { getSlots += `> ${plants.emoji} **${plants.plant}** | ⏱ <t:${Math.floor(plants.timeLimit / 1000)}:R>\n` }
        info.addFields({ name: "🌱 Plots", value: `${getSlots}` })
      }
      interaction.reply({ embeds: [info.setFooter({ text: `The plots have an Interval time of 10 seconds...` })] });
    } else {
      consult = await farm.findOne({ userId: member.id })
      if (!consult) return interaction.reply({ content: `This user has not their house opened!`, ephemeral: true })
      await interaction.deferReply()
      interaction.followUp({ embeds: [new EmbedBuilder().setTitle(`${member.username.endsWith('s') ? `${member.username}'` : `${member.username}'s`} Farmer tag`).addFields({ name: `🏠 House ID`, value: `${consult.houseId}`, inline: true }, { name: `👛 Money`, value: `💵 \`${nFormat.format(consult.economy.money)}\``, inline: true }, { name: `💰 Bank`, value: `💵 \`${nFormat.format(consult.economy.bank)}\``, inline: true }).setThumbnail(member.displayAvatarURL()).setColor("Green")] })
    }
  },
};
