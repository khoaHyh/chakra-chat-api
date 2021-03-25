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
const flash = require("connect-flash");
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const connectDB = require("./utilities/db");
const auth = require("./auth");
const handleRegister = require("./controllers/register");
const sessionStore = MongoStore.create({ mongoUrl: process.env.MONGO_URI });
const User = require("./models/user");
const Conversations = require("./models/conversations");
const sendEmail = require("./utilities/sendEmail");
const onAuthorize = require("./utilities/onAuthorize");

connectDB();

/** START OF MIDDLEWARE **/
// Implement a Root-Level Request Logger Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
//app.use(
//  cors({
//    origin: "https://discord-clone-khoahyh.netlify.app",
//    credentials: true,
//  })
//);
app.use(flash());
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
    //cookie: { maxAge: 1000 * 60 * 60 * 24 }, // set secure: true for https(prod)
    cookie: {
      sameSite: "none",
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
    key: "express.sid",
    store: sessionStore,
  })
);
app.use(passport.initialize());
app.use(passport.session());
/** END OF MIDDLEWARE **/

// Parse and decode the cookie that contains the passport session
// then deserialize to obtain user object
io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: "express.sid",
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorize.success,
    fail: onAuthorize.fail,
  })
);

auth(passport);

// Listen for error events on the database connection
mongoose.connection.on("error", (err) => {
  // Will not log if database disconnects, need to listen for disconnection for that
  logError(err);
});

io.on("connection", (socket) => {
  console.log("user connected.");
  socket.on("disconnect", () => {
    console.log("user disconnected.");
  });
  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    socket.broadcast.emit("received", { message: msg });

    connect.then((db) => {
      try {
        let chatMessage = new Conversations({
          message: msg,
          sender: socket.request.user.username,
        });
        chatMessage.save((err, doc) => {
          if (err) return res.json({ success: false, err });
          Conversations.find({ sender: doc.sender })
            .populate("sender")
            .exec((err, doc) => {
              return io.emit("chat message", doc);
            });
        });
      } catch (error) {
        console.log(error);
      }
    });
  });
});

app.get("/", (req, res) => {
  console.log("req.user:", req.user);
  console.log("req.session:", req.session);
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

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      console.log("info.message:", info);
      return res.status(403).json({ success: false, message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res
        .status(200)
        .json({ username: req.user.username, active: req.user.active });
    });
  })(req, res, next);
});

app.post("/register", (req, res, next) => {
  handleRegister(req, res, next);
});

app.post("/resend", async (req, res) => {
  let email = req.body.email;

  const user = await User.findOne({ email: email });
  if (user) {
    sendEmail(email, user.emailHash);
    res.status(200).json({ message: "Resent the verification email!" });
  } else {
    res.status(404).json({
      message: "No user found with that email. Please register again.",
    });
  }
});
app.get("/confirmation/:hash", async (req, res) => {
  const { hash } = req.params;
  try {
    console.log("lookup user and update");
    User.findOneAndUpdate(
      { emailHash: hash },
      { active: true },
      { returnOriginal: false },
      (err, data) => {
        if (err) console.log("confirmation error:", error);
        console.log("user confirmed!", data);
      }
    );
  } catch (error) {
    console.log("send an error");
  }
  //TODO redirect to login
});

app.get("/auth/github", passport.authenticate("github"));

app.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    //failureRedirect: "https://discord-clone-khoahyh.netlify.app/login",
    failureRedirect: "/login",
    session: true,
  }),
  (req, res) => {
    console.log("github session:", req.session);
    console.log("user info:", req.user);
    res.redirect("http://localhost:3000/chat");
    //res.redirect("https://discord-clone-khoahyh.netlify.app/chat");
  }
);

const PORT = process.env.PORT || 3080;
//app.listen(PORT, () => {
//  console.log(`Listening on port ${PORT}`);
//});
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
