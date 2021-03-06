const mongoose = require("mongoose");

const channelDataSchema = new mongoose.Schema({
  channelName: { type: String, unique: true },
  creator: String,
  conversation: [
    {
      message: String,
      timestamp: String,
      sender: String,
    },
  ],
});

module.exports = mongoose.model("channelData", channelDataSchema);
