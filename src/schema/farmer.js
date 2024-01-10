const mongoose = require("mongoose");
const Schema = new mongoose.Schema({
  userId: String,
  houseId: String,
  visitCounter: { type: Number, default: 0 },
  economy: {
    money: { type: Number, default: 30 },
    bank: { type: Number, default: 0 },
  },
  cooldowns: [],
  inventory: [],
  // 3 plants per plot | Default you have only one plot
  plotsSlot: [],
  // array where the vegetables/fruit is ready to be collected
  basket: [],
  // list of redeemed codes!
  RdmCodes: []
});

module.exports = mongoose.model("farmer", Schema);
