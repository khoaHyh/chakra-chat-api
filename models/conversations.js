const mongoose = require("mongoose");

const convoSchema = new mongoose.Schema(
  {
    channelName: String,
    conversation: [
      {
        message: String,
        sender: {
          displayName: String,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("conversations", convoSchema);
