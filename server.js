"use strict";
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const connectDB = require("./utilities/db");
const User = require("./models/user");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const auth = require("./auth");
const passport = require("passport");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const handleRegister = require("./controllers/register");

// Middleware to check if a user is authenticated
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
  res.status(200).json("woot");
});
app.get("/chat", ensureAuthenticated, (req, res) => {
  res.status(200).json({ message: "enter chat" });
});
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
app.post("/register", (req, res, next) => {
  handleRegister(req, res, next);
});
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
