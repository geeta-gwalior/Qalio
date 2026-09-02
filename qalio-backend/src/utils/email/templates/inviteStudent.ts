interface InvitationEmailProps {
  Email: string;
  firstName: string;
  lastName: string;
  CollegeId: string;
  link: string;
  phone: string;
  major: string;
  batch: string;
  collegeName: string;
}

export const generateInvitationEmail = ({
  Email,
  firstName,
  lastName,
  CollegeId,
  link,
  phone,
  collegeName,
  major,
  batch,
}: InvitationEmailProps) => {
  const URL = process.env.STUDENT_URL || "http://localhost:3000/auth/register";
  const registerLink = `${URL}?inviteLink=${link}&CollegeId=${CollegeId}&Email=${Email}&firstName=${firstName}&lastName=${lastName}&phone=${phone}&major=${major}&batch=${batch}`;

  return {
    email: Email,
    subject: "Invitation to join Skill Access",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Skill Access</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
      background-color: #f8f8f8;
      color: #333333;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header-section {
      background-color: #E0F2F7; /* Lighter background for better logo visibility */
      padding: 30px 40px;
      text-align: center;
      color: #333333; /* Changed text color for contrast against light background */
    }
    .logo {
      max-width: 150px;
      height: auto;
      display: block;
      margin: 0 auto 20px;
    }
    .header-title {
      font-size: 28px;
      font-weight: bold;
      margin: 0;
    }
    .content-section {
      padding: 40px;
      line-height: 1.6;
      font-size: 16px;
    }
    .button-wrapper {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #6eb9be; /* Primary color */
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      font-size: 17px;
      transition: background-color 0.2s ease-in-out;
    }
    .button:hover {
      background-color: #0D9AAC; /* Darker shade on hover */
    }
    .link-text {
      word-break: break-all;
      font-size: 14px;
      color: #555555;
      margin-top: 15px;
    }
    .notes-section {
      background-color: #f0f7f7; /* Light background for notes */
      padding: 25px 40px;
      border-top: 1px solid #e0e0e0;
      font-size: 15px;
      color: #444444;
    }
    .notes-section h3 {
      margin-top: 0;
      color: #0D9AAC;
      font-size: 18px;
    }
    .notes-section ul {
      padding-left: 20px;
      margin-bottom: 0;
    }
    .notes-section li {
      margin-bottom: 8px;
    }
    .footer-section {
      padding: 25px 40px;
      text-align: center;
      font-size: 14px;
      color: #777777;
      border-top: 1px solid #eeeeee;
    }
    .footer-section p {
      margin: 0;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
        box-shadow: none;
      }
      .content-section, .header-section, .notes-section, .footer-section {
        padding: 20px;
      }
      .header-title {
        font-size: 24px;
      }
      .button {
        padding: 12px 24px;
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-section">
      <img class="logo" src="https://res.cloudinary.com/dic0ukpeu/image/upload/v1734001129/logoFinal_tldpct.png" alt="Skill Access Logo" />
      <h1 class="header-title">Welcome to Skill Access!</h1>
    </div>
    <div class="content-section">
      <p>Hello ${firstName},</p>
      <p>You have been invited to join Skill Access for students of <strong>${collegeName}</strong>.</p>
      <p>Thank you for your interest in Skill Access. We're excited to have you join our platform!</p>
      <p>To get started and unlock all features, please complete your profile by clicking the button below:</p>
      <div class="button-wrapper">
        <a href="${registerLink}" class="button">Complete Your Profile</a>
      </div>
      <p>If the button above doesn't work, you can copy and paste the following link into your web browser:</p>
      <p class="link-text">${registerLink}</p>
    </div>
    <div class="notes-section">
      <h3>Important Notes:</h3>
      <ul>
        <li>Please provide accurate and complete information to ensure a smooth experience.</li>
        <li>You will be notified via email when new tests and opportunities become available after your profile is fully set up.</li>
      </ul>
    </div>
    <div class="footer-section">
      <p>Best regards,</p>
      <p>The Skill Access Team</p>
      <p>&copy; ${new Date().getFullYear()} Skill Access. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  };
};
