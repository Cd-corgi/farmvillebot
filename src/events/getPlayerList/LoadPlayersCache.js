const farmer = require('../../schema/farmer')

module.exports = async (client) => {
    try {
        let getPlayers = await farmer.find({})
        for (let i of getPlayers) { client.players.set(`${i.userId}`, i) }
        console.log(`${client.players.size > 1 ? `${client.players.size} Players` : `${client.players.size} Player`} loaded!`)
    } catch (error) {
        console.log(error)
    }
}