const farmer = require('../schema/farmer')
const moment = require('moment')
const conf = require('../config/config.json')
const { givingItems, rangeNumber } = require('../utils/functions')

module.exports = async (client) => {
    setInterval(async () => {
        let farmers = await farmer.find({})
        farmers = farmers.filter((x) => x.cooldowns.length > 0)
        if (farmers.length < 1) return
        let getCurrentTime = Date.parse(moment(new Date()))
        for (const users of farmers) {
            users.cooldowns.forEach(async (v) => {
                if (getCurrentTime >= v.time) {
                    if (v.name == "Extraction") {
                        let g = { item: "Raw Salt", type: "products", emoji: "🧂", amount: rangeNumber(1, 5) }
                        await givingItems(g, users)
                    }
                    users.cooldowns = users.cooldowns.filter((z) => z.name !== v.name)
                    await farmer.findOneAndUpdate({ userId: users.userId }, { cooldowns: users.cooldowns })
                }
            })
        }
    }, (conf.refreshTicks * 2))
}