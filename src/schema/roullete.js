const mongoose = require('mongoose')
const Schema = new mongoose.Schema({
    item: String,
    emoji: String,
    type: String,
    probability: Number,
    rarity: String,
    amount: Number
})


module.exports = mongoose.model("roullete-prizes", Schema)