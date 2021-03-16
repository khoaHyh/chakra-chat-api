const crypto = require("crypto");
const fs = require("fs");

// Generates a private and public key using Elliptic Curve Cryptography
function genKeyPair() {
  // Generates an object where the keys are stored in properties
  const keyPair = crypto.generateKeyPairSync("rsa", {
    // bits - standard for RSA keys
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "pkcs1", // Public Key Cryptography Standards 1
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs1",
      format: "pem",
    },
  });
  // Create the public key file
  fs.writeFileSync(__dirname + "/id_rsa_pub.pem", keyPair.publicKey);
  // Create the private key file
  fs.writeFileSync(__dirname + "/id_rsa_priv.pem", keyPair.privateKey);
}
