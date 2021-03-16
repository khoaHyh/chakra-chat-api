const crypto = require("crypto");

const decryptWithPrivateKey = (privateKey, encryptedMessage) => {
  return crypto.privateDecrypt(privateKey, encryptedMessage);
};

const decryptWithPublicKey = (publicKey, encryptedMessage) => {
  return crypto.publicDecrypt(publicKey, encryptedMessage);
};

modules.exports = { decryptWithPrivateKey, decryptWithPublicKey };
