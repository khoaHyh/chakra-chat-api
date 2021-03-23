const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/user");
const sendEmail = require("../utilities/sendEmail");

module.exports = async (req, res, next) => {
  let uname = req.body.username;
  let email = req.body.email;

  // Check if the user is already in the database and act accordingly
  let user = await User.findOne({ username: uname });
  if (user) {
    console.log(`user exists: ${user.username}`);
    res
      .status(200)
      .json({ message: `The username (${uname}) already exists.` });
  } else {
    // Implement saving a hash
    const hash = await bcrypt.hash(req.body.password, 12);
    const emailHash = crypto.randomBytes(16).toString("hex");
    console.log(emailHash);

    user = new User({
      email: email,
      emailHash: emailHash,
      username: uname,
      password: hash,
    });

    sendEmail(email, emailHash);

    user.save((err, doc) => {
      if (err) {
        console.error(`save error: ${err}`);
        res.redirect("/");
      }
      console.log(`Document inserted successfully, ${user.username}`);
      console.log("user:", user);
      console.log("doc:", doc);
      res.status(201).json(user);
    });
  }
};
