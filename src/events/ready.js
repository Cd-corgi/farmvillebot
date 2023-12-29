const farmer = require('../schema/farmer')
const moment = require('moment')
const seeds = require('../config/seeds.json')
const conf = require('../config/config.json')
const { rangeNumber } = require('../utils/functions')

module.exports = async (client) => {
    console.clear()
    console.log("Ready!")
    setInterval(async () => {
        let time = Date.parse(moment(new Date()))
        let farmers = await farmer.find({})
        farmers = farmers.filter((x, i) => x.plotsSlot.length > 0)
        for (const users of farmers) {
            users.plotsSlot.forEach(async (y, i) => {
                if (time >= y.timeLimit) {
                    seeds.forEach(async (b) => {
                        if (b.name.toLowerCase() == y.plant.toLowerCase()) {
                            let cantidadADar = rangeNumber(b.item.units.min, b.item.units.max)
                            users.plotsSlot = users.plotsSlot.filter((x) => x.plant !== y.plant)
                            if (users.basket.some((v) => v.product.toLowerCase() == y.plant.toLowerCase())) {
                                let getPpos = users.basket[users.basket.map((v) => v.product).indexOf(y.plant)]
                                getPpos.amount += cantidadADar
                            } else {
                                users.basket.push({ product: y.plant, emoji: y.emoji, amount: cantidadADar })
                            }
                            await farmer.updateOne({ userId: users.userId }, { basket: users.basket, plotsSlot: users.plotsSlot })
                        }
                    })
                }
            })
        }
    }, conf.refreshTicks);
}