import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  pool: true, // Enable connection pooling
  maxConnections: 5, // Reuse up to 5 SMTP connections
  maxMessages: 100, // Max messages per connection
  rateLimit: 14, // AWS SES default: 14 emails/sec
});
