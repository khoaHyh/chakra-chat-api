const mongoose = require("mongoose");

const convoSchema = new mongoose.Schema({
  channelName: { type: String, unique: true },
  conversation: [
    {
      message: String,
      timestamp: String,
      sender: String,
    },
  ],
});

module.exports = mongoose.model("conversations", convoSchema);
