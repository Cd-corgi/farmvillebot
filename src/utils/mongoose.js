const mongoose = require('mongoose')
const { mongo } = require('../config/config.json')

module.exports = async  () => {
    try {
        mongoose.set("strictQuery", true)
        await mongoose.connect(mongo).then(() => { console.log(`[🍃] Mongoose Connected!`) })
    } catch (error) {
        console.log(error)
    }
}