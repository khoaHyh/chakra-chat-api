require("dotenv").config();
const nodemailer = require("nodemailer");

module.exports = (email, hash) => {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_PW,
    },
  });

  //const link = `http://localhost:3000/confirmation/${hash}`;
  const link = `https://discord-clone-khoahyh.netlify.app/confirmation/${hash}`;

  let mailOptions = {
    from: `"discord-clone-khoahyh 👻" <${process.env.GMAIL_EMAIL}>`, // sender address
    to: email, // list of receivers
    subject: "Confirm email for discord-clone-khoahyh ✔", // Subject line
    html: `Hello,<br> Please click on the link to verify your email.<br><a href="${link}">Click here to verify</a>`, // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (err, res) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message:
          "Technical Issue! Please try again later or request assistance.",
      });
    }

    console.log("Email sent.");
    res.status(200).json({
      message: `A verication email has been sent to ${email}. Please check your inbox and click on the link or click resend.`,
    });
  });
};
