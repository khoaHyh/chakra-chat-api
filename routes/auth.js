const express = require("express");
const router = express.Router();
const passport = require("passport");
const handleAuth = require("../controllers/handleAuth");
const ensureAuthenticated = require("../utilities/ensureAuthenticated");

//const originUrl = "http://localhost:3000";
const originUrl = "https://chakra-chat.netlify.app";

router.get("/", ensureAuthenticated, handleAuth.sessionExists);

router.post("/register", handleAuth.register);

router.post("/resend", handleAuth.resendEmail);

router.post("/login", handleAuth.login);

router.get("/logout", handleAuth.logout);

router.get("/confirmation/:hash", handleAuth.confirmation);

router.get("/github", passport.authenticate("github"));

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${originUrl}/login`,
    session: true,
  }),
  (req, res) => {
    req.session.user_id = req.user.id;
    res.redirect(`${originUrl}/chat`);
  }
);

module.exports = router;
