// Modify httpOnly property of express-session based on origin
const httpOnlyCookie = (origin) => {
  return origin === "http://localhost:3000";
};

// Modify secure property of express-session based on origin
const secureCookie = (origin) => {
  return origin === "https://discord-clone-khoahyh.netlify.app";
};

module.exports = { httpOnlyCookie, secureCookie };
