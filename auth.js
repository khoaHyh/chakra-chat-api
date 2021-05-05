require("dotenv").config();
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("./models/user");

module.exports = (passport) => {
  // Convert object contents into a key
  passport.serializeUser((user, done) => done(null, user._id));
  // Convert key into original object and retrieve object contents
  passport.deserializeUser((id, done) => {
    User.findById(id, (err, doc) => {
      if (err) return done(err);
      done(null, doc);
    });
  });

  // Define process to use when we try to authenticate someone locally
  passport.use(
    "login",
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await User.findOne({ username: username });
        console.log(`User ${username} attempted to log in`);

        if (!user) {
          console.log(`User ${username} doesn't exist.`);
          return done(null, false, {
            message: "Invalid username or password.",
          });
        }

        const validated = await bcrypt.compare(password, user.password);

        if (!validated) {
          console.log("Invalid password");
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
          "https://discord-clone-api-khoahyh.herokuapp.com/auth/github/callback",
      },
      (accessToken, refreshToken, profile, done) => {
        console.log(profile);
        // Database logic here with callback containing our user object
        User.findOne({ githubId: profile.id }, (err, user) => {
          if (err) return done(err, null);

          if (user) {
            console.log(`user exists: ${user.username}`);
            return done(err, user);
          } else {
            user = new User({
              githubId: profile.id,
              username: profile.username,
              provider: "github",
              active: true,
            });

            user.save((err, doc) => {
              if (err) console.error(`save error: ${err}`);
              return done(err, doc);
            });
          }
        });
      }
    )
  );
};
