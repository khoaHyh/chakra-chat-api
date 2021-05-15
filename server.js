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
//const originUrl = "http://localhost:3000";
const originUrl = "https://chakra-chat.netlify.app";
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
//const ChannelData = require("./models/channelData");
//const User = require("./models/user");
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
      //secure: secureCookie(originUrl),
      //httpOnly: httpOnlyCookie(originUrl),
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

// Keep track of # of users
let numOfUsers = 0;

io.on("connection", (socket) => {
  numOfUsers++;
  const user = socket.request.user.username;

  // Welcome new connection
  io.emit("receive-message", {
    sender: "Chakra-Chat Server",
    timestamp: Date.now(),
    message: `${user} has joined the chat!`,
    numOfUsers,
  });

  // Emit when a user disconnects
  socket.on("disconnect", () => {
    numOfUsers--;
    io.emit("receive-message", {
      sender: "Chakra-Chat Server",
      timestamp: Date.now(),
      message: `${user} has left the chat.`,
      numOfUsers,
    });
  });

  // Listen for sent message
  //socket.on("send-message", async ({ id, message, timestamp, sender }) => {
  socket.on("send-message", ({ message, timestamp, sender }) => {
    io.emit("receive-message", { message, timestamp, sender, numOfUsers });

    //// Find existing channel chat history
    //const chatHistory = await ChannelData.findById(id);
    //if (!chatHistory) {
    //  return res.status(404).json({ message: "No existing channel found" });
    //}
    //const chatObject = {
    //  id,
    //  message,
    //  timestamp,
    //  sender,
    //};
    //// Push new message into array of the chat document
    //chatHistory.conversation.push(chatObject);
    //await chatHistory.save();
    //socket.emit("receive-message", chatObject);
  });
});

//app.get("/remove/allAccounts", (req, res) => {
//  User.deleteMany({}, (err, data) => {
//    if (err) {
//      console.log(err);
//      res.status(500).json({ message: "Error removing all users." });
//    } else {
//      res.status(200).json({ message: "Success! Removed all users." });
//    }
//  });
//});

// Routes
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 8080;
http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
