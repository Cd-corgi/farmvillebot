const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Discord = require('discord.js')
const farmer = require('../../schema/farmer')
const roullete = require('../../schema/roullete')
const { ruleta, givingItems } = require('../../utils/functions')

module.exports = {
  permissions: [PermissionFlagsBits.SendMessages],
  botP: [PermissionFlagsBits.SendMessages],
  data: new SlashCommandBuilder()
    .setName("roullete")
    .setDescription("🍀 Try your luck to get something in our Fortune Wheel")
    .addSubcommand(option =>
      option
        .setName("rewards")
        .setDescription("Check what rewards can be obtained")
    )
    .addSubcommand(option =>
      option
        .setName("play")
        .setDescription("Play the roullete to get the prize! Requires Tokens.")
    ),
  async run(client, interaction) {
    const sb = interaction.options.getSubcommand()
    const far = await farmer.findOne({ userId: interaction.user.id })
    if (!far) return interaction.reply({ content: `You do not have a home openned yet...`, ephemeral: true })
    switch (sb) {
      case "play":
        if (!far.inventory.some((v) => v.name == "Roullete Token" && v.type == "token")) return interaction.reply({ content: `You do not have a Ⓜ \`Roullete Token\` to participate.`, ephemeral: true })
        let getRR = await roullete.find({}).sort({ probability: -1 })
        var getToken = far.inventory[far.inventory.map((v) => v.name).indexOf("Roullete Token")]
        far.inventory[far.inventory.map((v) => v.name).indexOf("Roullete Token")].amount--
        if (getToken.amount < 1) far.inventory = far.inventory.filter((v) => v.name !== "Roullete Token")
        await farmer.findOneAndUpdate({ userId: interaction.user.id }, { inventory: far.inventory })
        var item = ruleta(getRR)
        await interaction.reply({ embeds: [new EmbedBuilder().setThumbnail("https://media.giphy.com/media/dxulHE1ksVyu8a73Xa/giphy.gif").setTitle(`🟠 You inserted the token`).setDescription(`Rolling the Roullete...`)] })
        setTimeout(async () => {
          var emoRarity = [{ "name": "Guaranted", "emoji": "⭐" }, { "name": "Common", "emoji": "🔵" }, { "name": "Uncommon", "emoji": "🟢" }, { "name": "Rare", "emoji": "🟠" }, { "name": "Very Rare", "emoji": "🟣" }, { "name": "Impossible", "emoji": "🔴" }, { "name": "Unique", "emoji": "✨" }]
          interaction.editReply({ content: `${interaction.user}`, embeds: [new EmbedBuilder().setFooter({ text: `You will get your earned item in your inventory!` }).setTitle(`✨ You got a prize! ✨`).setColor("Green").setDescription(`You just rolled the Roullete and you got...\n\n${emoRarity[emoRarity.map((x) => x.name).indexOf(item.rarity)].emoji} ${item.emoji} \`${item.item}\` (${item.item == "Money" ? "Economy" : item.type}) x ${item.amount}`).setThumbnail("https://media.giphy.com/media/LS1XHvIEaeHaWnWo6w/giphy.gif")] })
          await givingItems(item, far)
        }, 5000)
        break;
      case "rewards":
        let getR = await roullete.find({}).sort({ probability: -1 })
        var emoRarity = [{ "name": "Guaranted", "emoji": "⭐" }, { "name": "Common", "emoji": "🔵" }, { "name": "Uncommon", "emoji": "🟢" }, { "name": "Rare", "emoji": "🟠" }, { "name": "Very Rare", "emoji": "🟣" }, { "name": "Impossible", "emoji": "🔴" }, { "name": "Unique", "emoji": "✨" }]
        let list = ""
        getR.map((x, i) => list += `**${i + 1}** ${x.rarity.replace(x.rarity, emoRarity[emoRarity.map((x) => x.name).indexOf(x.rarity)].emoji)} ${x.emoji} \`${x.item}\` ${(x.probability >= 0.010 ? x.probability * 100 : x.probability * 10)}%\n`)
        interaction.reply({ embeds: [new Discord.EmbedBuilder().setFooter({ text: `To play this roullete, you should have Roullete Tokens... 1 Roll every 45 minutes!` }).setDescription(list.substring(0, 2048)).setThumbnail(client.user.displayAvatarURL()).setTitle(`📦 Roullete Rewards!`)] })
        break;
    }

  }
}