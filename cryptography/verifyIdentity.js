const crypto = require("crypto");
const fs = require("fs");
const { decryptWithPublicKey } = require("./decrypt");
const receivedData = require("./signMessage").packageOfDataToSend;

const hash = crypto.createHash(receivedData.algorithm);

const publicKey = fs.readFileSync(__dirname + "/id_rsa_pub.pem", "utf8");

const decryptMessage = decryptWithPublicKey(
  publicKey,
  receivedData.signedAndEncryptedData
);

const decryptedMessageHex = decryptedMessage.toString();

const hashOfOriginal = hash.update(JSON.stringify(receivedData.originalData));
const hashOfOriginalHex = hash.digest("hex");

if (hashOfOriginalHex === decryptedMessageHex) {
  console.log(
    "Success! The sender is valid and data has not been tampered with."
  );
} else {
  console.log("Uh oh... they are watching.");
}
