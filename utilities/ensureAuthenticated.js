// Middleware to check if user is authenticated
module.exports = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  console.log("ENSURE req.session:", req.session);
  console.log("ENSURE req.user:", req.user);
  res.status(401).json({ message: "User is not authenticated." });
};
