const crypto = require("crypto");
const hash = crypto.createHash("sha256");
const fs = require("fs");
const { encryptWithPrivateKey } = require("./encrypt");
const decrypt = require("./decrypt");

const myData = {
  firstName: "John",
  lastName: "Doe",
  socialSecurityNumber: "NOPE.",
};

// String version of our data that can be hashed
const myDataString = JSON.stringify(myData);

// Sets the value on the hash object
hash.update(myDataString);

// Hashed data in Hexidecimal format
const hashedData = hash.digest("hex");

const senderPrivateKey = fs.readFileSync(__dirname + "./id_rsa_priv.pem");

const signedMessage = encryptWithPrivateKey(senderPrivateKey, hashedData);

const packageOfDataToSend = {
  algorithm: "sha256",
  originalData: myData,
  signedAndEncryptedData: signedMessage,
};

module.exports = { packageOfDataToSend };
