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
const http = require("http").createServer(app);
//const originUrl = "http://localhost:3000";
const originUrl = "https://discord-clone-khoahyh.netlify.app";
const io = require("socket.io")(http, {
  cors: {
    origin: originUrl,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
const passportSocketIo = require("passport.socketio");
const connectDB = require("./utilities/db");
const auth = require("./auth");
const sessionStore = MongoStore.create({ mongoUrl: process.env.MONGO_URI });
const User = require("./models/user");
const ChannelData = require("./models/channelData");
const sendEmail = require("./utilities/sendEmail");
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

/** START OF MIDDLEWARE **/
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

/** END OF MIDDLEWARE **/

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

auth(passport);

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

app.post("/new/channel", (req, res, next) => {
  const channelName = req.body.channelName;
  const creator = req.body.creator;
  console.log(channelName, creator);

  ChannelData.findOne({ channelName }, (err, data) => {
    if (err) res.status(500).json(err);
    if (data) {
      console.log("Channel already exists");
      res.json({ message: "Channel already exists." });
    } else {
      ChannelData.create({ channelName, creator }, (err, data) => {
        if (err) return next(err);
        res.status(201).json(data);
      });
    }
  });
});

app.get("/get/channelList", (req, res, next) => {
  ChannelData.find((err, data) => {
    if (err) {
      console.log(err);
      res.status(500).json(err);
    } else {
      let channelList = [];
      data.map((channelData) => {
        const channelInfo = {
          id: channelData._id,
          name: channelData.channelName,
        };
        channelList.push(channelInfo);
      });

      res.status(200).json(channelList);
    }
  });
});

app.post("/remove/allChannels", (req, res) => {
  if (req.body.username === "boi1da") {
    ChannelData.deleteMany({}, (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json({ message: "Error removing all channels." });
      } else {
        res.status(200).json({ message: "Success! Removed all channels." });
      }
    });
  }
});

app.post("/new/message", (req, res) => {
  //let timestamp = new Date().toUTCString();
  const newMessage = req.body;
  const id = req.query.id || req.body.id;
  const update = {
    new: true,
    upsert: true,
    safe: true,
  };

  ChannelData.findByIdAndUpdate(
    id,
    {
      $push: { conversation: newMessage },
    },
    update,
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json(err);
      } else {
        res.status(201).json(data);
      }
    }
  );
});

app.get("/get/channelData", (req, res) => {
  ChannelData.find((err, data) => {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).json(data);
    }
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

/** START OF AUTHENTICATION ROUTES **/

app.get("/", (req, res) => {
  console.log("req.user:", req.user);
  console.log("req.session:", req.session);
  console.log("isAuthenticated:", req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.status(200).json({
      message: "isAuthenticated.",
      session: req.session,
      username: req.user.username,
    });
  } else {
    res.status(200).json({ message: "isNotAuthenticated." });
  }
});

app.get("/chat", (req, res) => {
  console.log("isAuth: " + req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.status(200).json({
      message: "isAuthenticated.",
      session: req.session,
      username: req.user.username,
    });
  } else {
    res.status(200).json({ message: "isNotAuthenticated." });
  }
});

app.post("/resend", (req, res) => {
  let email = req.body.email;

  User.findOne({ email: email }, (err, user) => {
    if (err) {
      res.status(404).json({
        message: "Error",
        error: err,
      });
    } else {
      sendEmail(email, user.emailHash);
      res
        .status(200)
        .json({ message: `Resent the verification email to ${email}` });
    }
  });
});
app.post("/remove/allAccounts", () => {
  if (req.body.username === "boi1da") {
    User.deleteMany({}, (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json({ message: "Error removing all users." });
      } else {
        res.status(200).json({ message: "Success! Removed all users." });
      }
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
        if (err) {
          console.log("confirmation error:", error);
          res.status(500).json(error);
        }
        console.log("user confirmed!", data);
        res.status(200).json(data);
      }
    );
  } catch (error) {
    console.log("send an error");
    res.status(500).json(error);
  }
  //TODO redirect to login
});

app.use("/auth", authRoutes);

/** END OF AUTHENTICATION ROUTES **/

const PORT = process.env.PORT || 8080;
http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
