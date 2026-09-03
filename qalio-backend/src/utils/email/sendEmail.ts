import nodemailer from "nodemailer";

export const createTransporter = () => {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER || process.env.SMTP_MAIL;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;

  if (user && pass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: user || "demo@qalio.com",
      pass: pass || "demopassword",
    },
  });
};

const sendEmail = async (mailOptions: {
  email: string;
  subject: string;
  html?: string;
  message?: string;
}) => {
  try {
    const user = process.env.GMAIL_USER || process.env.SMTP_USER || process.env.SMTP_MAIL;
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;

    const options = {
      from: `Qalio Hiring Platform <${user || "noreply@qalio.com"}>`,
      to: mailOptions.email,
      subject: mailOptions.subject,
      html: mailOptions.html || mailOptions.message,
      text: mailOptions.message,
    };

    if (user && pass) {
      const transporter = createTransporter();
      const result = await transporter.sendMail(options);
      console.log(`[EMAIL SUCCESS] Sent to ${mailOptions.email} (MessageID: ${result.messageId})`);
      return { success: true, result };
    } else {
      console.log("====== PRODUCTION EMAIL LOG (Set GMAIL_USER & GMAIL_APP_PASSWORD to send live) ======");
      console.log("To:", options.to);
      console.log("Subject:", options.subject);
      console.log("==================================================================================");
      return { success: true, result: { messageId: "dev-simulated-id" } };
    }
  } catch (error: any) {
    console.error("Email send failure:", error);
    return { success: false, error: error.message };
  }
};

export default sendEmail;
