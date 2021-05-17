require("dotenv").config();
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("./models/user");

module.exports = (passport) => {
  // Convert object contents into a key
  passport.serializeUser((user, done) => done(null, user.id));

  // Convert key into object
  passport.deserializeUser(async (id, done) => {
    try {
      let user = await User.findById(id);
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
        //"http://localhost:8080/auth/github/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ githubId: profile.id });

          if (user) return done(null, user);

          user = await User.create({
            githubId: profile.id,
            email: Array.isArray(profile.emails)
              ? profile.emails[0].value
              : "No public email",
            username: profile.username,
            provider: "github",
            active: true,
          });

          return done(null, user);
        } catch (error) {
          console.log(error);
          return done(error);
        }
      }
    )
  );
};
