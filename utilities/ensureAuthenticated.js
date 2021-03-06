// Middleware to check if user is authenticated
module.exports = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "User is not authenticated." });
};
