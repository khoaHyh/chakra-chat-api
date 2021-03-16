"use strict";
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const connectDB = require("./utilities/db");
const Conversations = require("./models/conversations");
const User = require("./models/user");
const Pusher = require("pusher");
//const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const auth = require("./auth");
const passport = require("passport");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// Middleware to check if a user is authenticated
// Prevents users going to /profile whether they authenticated or not
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) next();
  res.status(200).json({ message: "User is not authenticated." });
};
// Implement a Root-Level Request Logger Middleware
app.use((req, res, next) => {
  // console.log(req.method + " " + req.path + " - " + req.ip);
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

// Set up our express app to use session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

connectDB();
auth(passport);

// Listen for error events on the database connection
mongoose.connection.on("error", (err) => {
  // Will not log if database disconnects, need to listen for disconnection for that
  logError(err);
});
app.get("/", (req, res) => {
  // get list of all users
  res.status(200).json("woot");
});
app.get("/chat", ensureAuthenticated, (req, res) => {
  res.status(200).json({ message: "enter chat" });
});
// Unauthenticate user
app.get("/logout", (req, res) => {
  req.logout();
  res.status(200).json({ message: "logout" });
});
// Authenticate on route /login
app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/" }),
  (req, res) => {
    res.status(200).json(req.user.username);
  }
);
app.post("/register", async (req, res, next) => {
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

    user = new User({ email: email, username: uname, password: hash });

    const main = async () => {
      // Generate test SMTP service account from ethereal.email
      // Only needed if you don't have a real mail account for testing
      let testAccount = await nodemailer.createTestAccount();

      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });

      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: '"discord-clone-khoahyh 👻" <khoahuynhapps@gmail.com>', // sender address
        to: email, // list of receivers
        subject: "Hello ✔", // Subject line
        text: "Hello world?", // plain text body
        html: "<b>Hello world?</b>", // html body
      });

      console.log("Message sent: %s", info.messageId);
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

      // Preview only available when sending through an Ethereal account
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    };

    main().catch(console.error);

    user.save((err, doc) => {
      if (err) {
        console.error(`save error: ${err}`);
        res.redirect("/");
      }
      console.log(`Document inserted successfully, ${user.username}`);
      res.status(201).json(user);
    });
  }
});
// Social authentication using Github strategy
app.get("/auth/github", passport.authenticate("github"));
app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
  (req, res) => {
    req.session.user_id = req.user.id;
    res.status(200).json(req.session.user_id);
  }
);
// changed from 3000
const PORT = process.env.PORT || 3080;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
