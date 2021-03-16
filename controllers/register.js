const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const User = require("../models/user");

module.exports = async (req, res, next) => {
  let uname = req.body.username;
  let email = req.body.email;

  // Check if the user is already in the database and act accordingly
  let user = await User.findOne({ username: uname });
  if (user) {
    console.log(`user exists: ${user.username}`);
    res
      .status(200)
      .json({ message: `The username (${uname}) already exists.` });
  } else {
    // Implement saving a hash
    const hash = await bcrypt.hash(req.body.password, 12);

    user = new User({ email: email, username: uname, password: hash });

    const main = async () => {
      // Generate test SMTP service account from ethereal.email
      // Only needed if you don't have a real mail account for testing
      let testAccount = await nodemailer.createTestAccount();

      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });

      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: '"discord-clone-khoahyh 👻" <khoahuynhapps@gmail.com>', // sender address
        to: email, // list of receivers
        subject: "Hello ✔", // Subject line
        text: "Hello world?", // plain text body
        html: "<b>Hello world?</b>", // html body
      });

      console.log("Message sent: %s", info.messageId);
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

      // Preview only available when sending through an Ethereal account
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    };

    main().catch(console.error);

    user.save((err, doc) => {
      if (err) {
        console.error(`save error: ${err}`);
        res.redirect("/");
      }
      console.log(`Document inserted successfully, ${user.username}`);
      res.status(201).json(user);
    });
  }
};
