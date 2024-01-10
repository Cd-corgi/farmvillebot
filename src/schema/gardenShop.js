const mongoose = require('mongoose')
const Schema = new mongoose.Schema({
    name: String,
    description: String,
    stackable: Boolean,
    type: String,
    emoji: String,
    price: Number
})

module.exports = mongoose.model("garden-shop", Schema)