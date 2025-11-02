// Using Gmail Service for sending emails to the users

/* const nodemailer = require('nodemailer');

const sendEmail = (options) => {
  // 1. Create a transporter

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      PASS: process.env.EMAIL_PASSWORD,
    },
    // Now, activate in Gmail, less secure app option
  });

  // 2. Define the email options
  // 3. Actually send the email
};

*/

// Using mailtrap

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create a transporter

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,

    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2. Define the email options

  const mailOptions = {
    from: 'Shahid Ahmad <shahidahmad8025@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html
  };

  // 3. Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
