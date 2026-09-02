// const nodemailer = require("nodemailer");

// const sendEmail = async (options: { email: any; subject: any; html?: any; message?: any }) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port: process.env.SMTP_PORT,
//       // service: process.env.SMTP_SERVICE,
//       secure:false,
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASSWORD,
//       },
//     });

//     let mailOptions: any = {
//       from: process.env.SMTP_MAIL,
//       to: options.email,
//       subject: options.subject,
//     };

//     if (options.html) {
//       mailOptions.html = options.html;
//     } else if (options.message) {
//       mailOptions.text = options.message;
//     }

//     const mail = await transporter.sendMail(mailOptions);
//     return { success: true, message: "Mail sent successfully", mail };
//   } catch (error) {
//     console.error(error);
//     return { success: false, message: "Email not sent" };
//   }
// };

// export default sendEmail;

// utils/email/sendEmail.ts
import { transporter } from "./smtp";

const sendEmail = async (mailOptions: {
  email: any;
  subject: any;
  html?: any;
  message?: any;
}) => {
  try {
    let options: any = {
      from: process.env.SMTP_MAIL,
      to: mailOptions.email,
      subject: mailOptions.subject,
    };

    if (mailOptions.html) {
      options.html = mailOptions.html;
    } else if (mailOptions.message) {
      options.text = mailOptions.message;
    }

    console.log("====== MOCKED EMAIL SEND ======");
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    console.log("Content:", options.text || options.html);
    console.log("===============================");

    // Simulate success
    return { success: true, result: { messageId: "mocked-id" } };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
};

export default sendEmail;
