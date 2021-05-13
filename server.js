"use strict";
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const logger = require("morgan");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const passportSocketIo = require("passport.socketio");

const http = require("http").createServer(app);
const originUrl = "http://localhost:3000";
//const originUrl = "https://discord-clone-khoahyh.netlify.app";
const io = require("socket.io")(http, {
  cors: {
    origin: originUrl,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
const connectDB = require("./utilities/db");
const auth = require("./auth");
const sessionStore = MongoStore.create({ mongoUrl: process.env.MONGO_URI });
const User = require("./models/user");
const ChannelData = require("./models/channelData");
const onAuthorize = require("./utilities/onAuthorize");
const {
  httpOnlyCookie,
  secureCookie,
} = require("./utilities/handleSessionCookies");
const authRoutes = require("./routes/auth");

// Connect to MongoDB database
connectDB();

// Enable app to use passport strategies
auth(passport);

app.use(logger("dev"));
app.use(cors({ credentials: true, origin: originUrl }));

// Parse cookies attached to client request object
app.use(cookieParser());

// Deal with incoming data in the body of the request object
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// https://stackoverflow.com/questions/44039069/express-session-secure-cookies-not-working
app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // Equals 1 day (1 day * 1000 ms/1 sec * 60 sec/1 min * 60 min/1 hr * 24 hr/1 day)
    // set httponly: false for https
    //cookie: { maxAge: 1000 * 60 * 60 * 24 }, // set secure: true for https(prod)
    cookie: {
      sameSite: "none",
      //secure: true,
      secure: secureCookie(originUrl),
      //httpOnly: false,
      httpOnly: httpOnlyCookie(originUrl),
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
    key: "express.sid",
    store: sessionStore,
  })
);

// Initialize passport and allow persistent login sessions
app.use(passport.initialize());
app.use(passport.session());

// Parse and decode the cookie that contains the passport session
// then deserialize to obtain user object
io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: "express.sid",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    success: onAuthorize.success,
    fail: onAuthorize.fail,
  })
);

// Listen for error events on the database connection
mongoose.connection.on("error", (err) => {
  // Will not log if database disconnects, need to listen for disconnection for that
  logError(err);
});

io.on("connection", (socket) => {
  const user = socket.request.user.username;

  // Welcome new connection
  socket.emit("message", `Welcome ${user}!`);

  // Emit when a user disconnects
  socket.on("disconnect", () => {
    io.emit("message", `${user} has left the chat.`);
  });

  // Listen for sent message
  socket.on("send-message", ({ id, message, timestamp, sender }) => {
    const update = {
      new: true,
      upsert: true,
      safe: true,
    };

    ChannelData.findByIdAndUpdate(
      id,
      {
        $push: { conversation: { message, timestamp, sender } },
      },
      update,
      (err, data) => {
        if (err) {
          console.log(err);
          res.status(500).json(err);
        } else {
          socket.emit("receive-message", data.conversation);
        }
      }
    );
  });
});

app.get("/get/conversation", (req, res) => {
  const id = req.query.id;

  ChannelData.findById(id, (err, data) => {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).json(data);
    }
  });
});

// Routes
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 8080;
http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
