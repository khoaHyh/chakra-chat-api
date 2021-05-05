const passport = require("passport");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const Filter = require("bad-words");
const filter = new Filter();
const User = require("../models/user");
const sendEmail = require("../utilities/sendEmail");

// Utilizes Custom Callback of passport.js to register users
const register = async (req, res, next) => {
  let username = req.body.username;
  let email = req.body.email;

  if (!username || !email || !req.body.password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  if (filter.isProfane(uname)) {
    return res
      .status(422)
      .json({ message: "Username must not contain profanity." });
  }

  try {
    // Check if the username or email are already in the database and act accordingly
    let user = await User.findOne({ username });
    let emailExists = await User.findOne({ email });
    if (user) {
      console.log(`user exists: ${user.username}`);
      return res
        .status(409)
        .json({ message: `The username (${uname}) already exists.` });
    } else if (emailExists) {
      return res.status(409).json({
        message: `An account with the email (${email}) already exists.`,
      });
    }

    // Create hash for password and email
    const hash = await bcrypt.hash(req.body.password, 12);
    const emailHash = crypto.randomBytes(16).toString("hex");

    sendEmail(email, emailHash);

    // Save user in database
    user = await User.create({
      email,
      emailHash: emailHash,
      username,
      password: hash,
    });

    return res.status(201).json({
      success: true,
      message: `User ${username} successfully registered!`,
    });
  } catch (error) {
    console.log("passport register error:", error);
    return next(error);
  }
};

const login = async (req, res, next) => {
  passport.authenticate("login", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ success: false, message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);

      console.log(`${user} successfully authenticated.`);
      return res.status(200).json({
        success: true,
        message: info.message,
        userId: user._id,
        username: user.username,
      });
    });
  })(req, res, next);
};

// Differentiate on outcome of logout handler by response body instead of http status code
const logout = (req, res) => {
  if (!req.user) {
    // Could return a status code of 404 but depends what the client prefers
    return res
      .status(200)
      .json({ message: "No user session to unauthenticate." });
  }
  req.logout();
  console.log(`${req.user.username} successfully unauthenticated.`);
  res.status(200).json({ message: "Unauthenticated." });
};

// Respond with code 200 and specific response body if user session exists
const sessionExists = (req, res) => {
  res.status(200).json({
    message: "Authenticated!",
    sessionPassportId: req.session.passport.user,
    username: req.user.username,
  });
};

module.exports = { register, login, logout, sessionExists };
