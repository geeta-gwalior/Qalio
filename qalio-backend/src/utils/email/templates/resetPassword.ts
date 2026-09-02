interface ForgotPasswordEmailProps {
  email: string;
  firstName: string;
  resetToken: string;
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export function generatePasswordResetEmail({
  email,
  firstName,
  resetToken,
}: ForgotPasswordEmailProps): EmailPayload {
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetLink = `${FRONTEND_URL}/auth/reset-password?token=${resetToken}&email=${email}`;

  return {
    to: email, // Change 'email' to 'to'
    subject: "Reset Your Password - Skill Access",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Skill Access</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    
    /* Main container */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    
    /* Header */
    .header {
      background: #E0F2F7;
      padding: 40px 20px;
      text-align: center;
      color: #333333;
    }
    
    .logo {
      max-width: 150px;
      height: auto;
      margin-bottom: 20px;
    }
    
    .header-text {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
    
    /* Content */
    .content {
      padding: 40px 30px;
    }
    
    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 20px;
    }
    
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    
    /* Button */
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    
    .reset-button {
      display: inline-block;
      background: linear-gradient(135deg, #0D9AAC 0%, #6eb9be 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(13, 154, 172, 0.3);
      transition: all 0.3s ease;
    }
    
    .reset-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(13, 154, 172, 0.4);
    }
    
    /* Alternative link */
    .alternative-link {
      background-color: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    
    .alternative-text {
      font-size: 14px;
      color: #718096;
      margin-bottom: 10px;
    }
    
    .link-text {
      font-size: 14px;
      color: #0D9AAC;
      word-break: break-all;
      font-family: monospace;
      background-color: #ffffff;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    
    /* Security notice */
    .security-notice {
      background: linear-gradient(135deg, #fef5e7 0%, #fed7aa 100%);
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    
    .security-title {
      font-size: 16px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }
    
    .security-icon {
      margin-right: 8px;
    }
    
    .security-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .security-item {
      font-size: 14px;
      color: #92400e;
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
    }
    
    .security-item:before {
      content: "•";
      color: #f59e0b;
      font-weight: bold;
      position: absolute;
      left: 0;
    }
    
    /* Footer */
    .footer {
      background-color: #f7fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-text {
      font-size: 14px;
      color: #718096;
      margin-bottom: 10px;
    }
    
    .company-name {
      font-weight: 600;
      color: #0D9AAC;
    }
    
    .support-text {
      font-size: 12px;
      color: #a0aec0;
      margin-top: 20px;
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .greeting {
        font-size: 18px;
      }
      
      .reset-button {
        padding: 14px 28px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <img src="https://res.cloudinary.com/dic0ukpeu/image/upload/v1734001129/logoFinal_tldpct.png" 
           alt="Skill Access Logo" 
           class="logo">
      <h1 class="header-text">Password Reset Request</h1>
    </div>
    
    <!-- Content -->
    <div class="content">
      <div class="greeting">Hello ${firstName}! 👋</div>
      
      <div class="message">
        We received a request to reset your password for your <strong>Skill Access</strong> account. 
        If you made this request, click the button below to create a new password.
      </div>
      
      <!-- Reset Button -->
      <div class="button-container">
        <a href="${resetLink}" class="reset-button">
          🔐 Reset My Password
        </a>
      </div>
      
      <!-- Alternative Link -->
      <div class="alternative-link">
        <div class="alternative-text">
          If the button above doesn't work, copy and paste this link into your browser:
        </div>
        <div class="link-text">${resetLink}</div>
      </div>
      
      <!-- Security Notice -->
      <div class="security-notice">
        <div class="security-title">
          <span class="security-icon">🛡️</span>
          Important Security Information
        </div>
        <ul class="security-list">
          <li class="security-item">This link will expire in <strong>1 hour</strong> for security reasons</li>
          <li class="security-item">If you didn't request this reset, please ignore this email</li>
          <li class="security-item">Never share this link with anyone</li>
          <li class="security-item">Always verify the sender before clicking links</li>
        </ul>
      </div>
      
      <div class="message">
        If you're having trouble or didn't request this password reset, please contact our support team immediately.
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">
        Best regards,<br>
        <span class="company-name">Skill Access Team</span>
      </div>
      <div class="support-text">
        This email was sent to ${email}. If you have any questions, 
        please contact our support team.
      </div>
    </div>
  </div>
</body>
</html>
`,
  };
}
