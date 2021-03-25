const mongoose = require("mongoose");

const convoSchema = new mongoose.Schema(
  {
    channelName: String,
    conversation: [
      {
        message: String,
        user: {
          displayName: String,
          email: String,
          photo: String,
          uid: String,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("conversations", convoSchema);
