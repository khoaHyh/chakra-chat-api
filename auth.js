require("dotenv").config();
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("./models/user");

module.exports = (passport) => {
  // Convert object contents into a key
  passport.serializeUser((user, done) => done(null, user._id));
  // Convert key into original object and retrieve object contents
  passport.deserializeUser(async (id, done) => {
    try {
      let user = await User.findById(id);
      if (!user) return done(null, false, { message: "user not found" });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Define process to use when we try to authenticate someone locally
  passport.use(
    "login",
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await User.findOne({ username: username });
        console.log(`User ${username} attempted to log in`);

        if (!user) {
          return done(null, false, {
            message: "Invalid username or password.",
          });
        }

        const validated = await bcrypt.compare(password, user.password);

        if (!validated) {
          return done(null, false, {
            message: "Invalid username or password.",
          });
        }

        return done(null, user, {
          message: `${username} logged in successfully.`,
        });
      } catch (error) {
        console.log("passport login error:", error);
        return done(error);
      }
    })
  );

  // Github authentication strategy
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          "https://chakra-chat-api.herokuapp.com/auth/github/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findById(profile.id);

          if (user) {
            return done(null, user, { message: "Github OAuth successful" });
          }

          console.log("profile:", profile);
          user = await User.create({
            id: profile.id,
            username: profile.username,
            provider: "github",
            active: true,
          });

          return done(null, user, { message: "Github OAuth successful." });
        } catch (error) {
          console.log(error);
          return done(error);
        }
      }
    )
  );
};
