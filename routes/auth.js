const express = require("express");
const router = express.Router();
const passport = require("passport");
const ensureAuthenticated = require("../utilities/ensureAuthenticated");
const handleAuth = require("../controllers/handleAuth");

//const originUrl = "http://localhost:3000";
const originUrl = "https://discord-clone-khoahyh.netlify.app";

router.post("/auth/register", handleAuth.register);

router.post("/auth/login", handleAuth.login);

router.get("/auth/logout", handleAuth.logout);

router.get("/auth/github", passport.authenticate("github"));

router.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${originUrl}/login`,
    session: true,
  }),
  (req, res) => {
    console.log("github session:", req.session);
    console.log("user info:", req.user);
    res.redirect(`${originUrl}/chat`);
  }
);

module.exports = router;
