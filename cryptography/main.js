const fs = require("fs");
const { encryptWithPublicKey } = require("./encrypt");
const { decryptWithPrivateKey } = require("./decrypt");

const publicKey = fs.readFileSync(__dirname + "/id_rsa_pub.pem", "utf8");

// Stores a Buffer object
const encryptedMessage = encryptWithPublicKey(
  publicKey,
  "Super secret message"
);

console.log(encryptedMessage.toString());

const privateKey = fs.readFileSync(__dirname + "/id_rsa_prive.pem", "utf8");
const decryptMessage = decryptWithPrivateKey(privateKey, encryptedMessage);

console.log(decryptedMessage.toString());
