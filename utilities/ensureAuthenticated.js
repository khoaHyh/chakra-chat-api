// Middleware to check if user is authenticated
module.exports = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  console.log("req.user:", req.user);
  console.log("req.session:", req.session);
  console.log("user session id:", req.session.user_id);
  res.status(401).json({ message: "User is not authenticated." });
};
