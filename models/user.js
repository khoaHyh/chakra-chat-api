const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, index: { unique: true } },
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String },
  joined: { type: Date, default: new Date() },
  provider: String,
  active: { type: Boolean, default: false },
});

module.exports = mongoose.model("user", userSchema);
