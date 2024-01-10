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
                            if (users.basket.some((v) => v.product === y.plant)) {
                                let getPpos = users.basket[users.basket.map((v) => v.product).indexOf(y.plant)]
                                getPpos.amount += cantidadADar
                            } else {
                                users.basket.push({ product: y.plant, emoji: y.emoji, amount: cantidadADar })
                            }
                            await farmer.updateOne({ userId: users.userId }, { basket: users.basket, plotsSlot: users.plotsSlot })
                        }
                    })
                    // let getPreparedPlant = users.plotsSlot.filter((v) => v.timeLimit <= time)
                    // let getSeedInfo = seeds.map((x) => x.name).indexOf(getPreparedPlant.plant)
                    // console.log(getPreparedPlant)
                    // if (getSeedInfo == -1) return;
                    // var getProduct = seeds[getSeedInfo]
                    // if (y.plant == getProduct.name) {
                    //     var getCantidad = rangeNumber(getProduct.item.units.min, getProduct.item.units.max)
                    //     users.plotsSlot = users.plotsSlot.filter((x) => x.plant !== getPreparedPlant[0].plant)
                    //     if (users.basket.some(x => x.product == getProduct.name)) {
                    //         users.basket[users.basket.map((n) => n.product).indexOf(getProduct.name)].amount += getCantidad
                    //     } else {
                    //         users.basket.push({ product: getProduct.item.itemName, emoji: getProduct.item.emoji, amount: getCantidad })
                    //     }
                    //     await farmer.updateOne({ userId: users.userId }, { basket: users.basket, plotsSlot: users.plotsSlot })
                    // }
                }
            })
        }
    }, conf.refreshTicks);
}