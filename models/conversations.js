const mongoose = require("mongoose");

const convoSchema = new mongoose.Schema(
  {
    channelName: String,
    message: String,
    sender: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("conversations", convoSchema);
