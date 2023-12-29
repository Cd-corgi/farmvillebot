const mongoose = require('mongoose')

module.exports = async  () => {
    try {
        mongoose.set("strictQuery", true)
        await mongoose.connect(process.env.mongo).then(() => { console.log(`[🍃] Mongoose Connected!`) })
    } catch (error) {
        console.log(error)
    }
}