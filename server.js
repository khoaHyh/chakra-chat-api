"use strict";
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const connectDB = require("./utilities/db");
const auth = require("./auth");
const handleRegister = require("./controllers/register");
const sessionStore = MongoStore.create({ mongoUrl: process.env.MONGO_URI });

/** START OF MIDDLEWARE **/
// Implement a Root-Level Request Logger Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});
//app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(
  cors({
    credentials: true,
    origin: "https://discord-clone-khoahyh.netlify.app/",
  })
);
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    // Equals 1 day (1 day * 1000 ms/1 sec * 60 sec/1 min * 60 min/1 hr * 24 hr/1 day)
    // set httponly: false for https
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // set secure: true for https(prod)
    store: sessionStore,
  })
);
app.use(passport.initialize());
app.use(passport.session());
/** END OF MIDDLEWARE **/

connectDB();
auth(passport);

// Listen for error events on the database connection
mongoose.connection.on("error", (err) => {
  // Will not log if database disconnects, need to listen for disconnection for that
  logError(err);
});
app.get("/", (req, res) => {
  console.log(req.user);
  if (req.user) {
    res.json({ username: req.user.username, active: req.user.active });
  } else {
    res.json({ user: null });
  }
});
app.get("/chat", (req, res) => {
  console.log("isAuth: " + req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.status(200).json({
      message: "isAuthenticated.",
      session: req.session,
    });
  } else {
    res.status(200).json({ message: "isNotAuthenticated." });
  }
});
app.get("/logout", (req, res) => {
  req.logout();
  res.status(200).json({ message: "logout" });
});
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "https://discord-clone-khoahyh.netlify.app/login",
  }),
  (req, res) => {
    console.log("loginAuth: " + req.isAuthenticated());
    if (req.isAuthenticated()) {
      res
        .status(200)
        .json({ username: req.user.username, active: req.user.active });
    } else {
      res.status(200).json("Invalid username or password");
    }
  }
);
app.post("/register", (req, res, next) => {
  handleRegister(req, res, next);
});
app.get("/auth/github", passport.authenticate("github"));
app.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: "https://discord-clone-khoahyh.netlify.app/login",
    session: true,
  }),
  (req, res) => {
    console.log("github session:", req.session);
    console.log("user info:", req.user);
    //res
    //  .status(200)
    //  .json({ username: req.user.username, active: req.user.active });
    //res.redirect("localhost:3000/chat");
    res.redirect("https://discord-clone-khoahyh.netlify.app/chat");
  }
);
const PORT = process.env.PORT || 3080;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
