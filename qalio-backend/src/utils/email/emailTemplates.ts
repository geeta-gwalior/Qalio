export interface EmailTemplateData {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  customMessage?: string;
  actionUrl?: string;
}

export const getShortlistedEmailTemplate = (data: EmailTemplateData): string => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Application Shortlisted - Qalio</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
      .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
      .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
      .content { padding: 32px 24px; font-size: 15px; line-height: 1.6; }
      .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 20px; }
      .button { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; margin-top: 20px; }
      .footer { background: #f1f5f9; text-align: center; padding: 16px; font-size: 13px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <h1>🎉 Application Update!</h1>
      </div>
      <div class="content">
        <span class="badge">Status: Shortlisted</span>
        <p>Dear <strong>${data.candidateName}</strong>,</p>
        <p>Great news! Your application for the position of <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong> has been <strong>shortlisted</strong>!</p>
        <p>${data.customMessage || "Our talent acquisition team was impressed with your qualifications and background. We would like to invite you for the next phase of our evaluation process."}</p>
        ${data.actionUrl ? `<p style="text-align: center;"><a href="${data.actionUrl}" class="button">View Dashboard & Next Steps</a></p>` : ""}
        <p>Best regards,<br><strong>${data.companyName} Hiring Team</strong><br><em>Powered by Qalio SaaS</em></p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Qalio SaaS Platform. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};

export const getRejectedEmailTemplate = (data: EmailTemplateData): string => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Application Status - Qalio</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
      .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
      .header { background: linear-gradient(135deg, #475569 0%, #334155 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
      .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
      .content { padding: 32px 24px; font-size: 15px; line-height: 1.6; }
      .footer { background: #f1f5f9; text-align: center; padding: 16px; font-size: 13px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <h1>Application Update</h1>
      </div>
      <div class="content">
        <p>Dear <strong>${data.candidateName}</strong>,</p>
        <p>Thank you for giving us the opportunity to consider your profile for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.</p>
        <p>${data.customMessage || "After careful consideration of all applicants, we regret to inform you that we have decided to move forward with other candidates whose experience more closely matches our immediate requirements."}</p>
        <p>We appreciate the time and effort you put into applying to ${data.companyName} and wish you the absolute best in your career journey.</p>
        <p>Warm regards,<br><strong>${data.companyName} Hiring Team</strong></p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Qalio SaaS Platform. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};

export const getAssessmentInviteEmailTemplate = (data: EmailTemplateData): string => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Skill Assessment Invitation - Qalio</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
      .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
      .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
      .content { padding: 32px 24px; font-size: 15px; line-height: 1.6; }
      .info-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 6px; margin: 20px 0; }
      .button { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; margin-top: 15px; }
      .footer { background: #f1f5f9; text-align: center; padding: 16px; font-size: 13px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <h1>📝 Online Assessment Invitation</h1>
      </div>
      <div class="content">
        <p>Dear <strong>${data.candidateName}</strong>,</p>
        <p>You have been invited to take an online technical skill assessment for the role of <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong>.</p>
        
        <div class="info-box">
          <strong>⚠️ Anti-Cheat & Test Instructions:</strong>
          <ul>
            <li>Please ensure a stable internet connection and quiet environment.</li>
            <li>Tab switches and window blurs are monitored and logged.</li>
            <li>Copy/paste functionality is disabled during the assessment.</li>
          </ul>
        </div>

        ${data.actionUrl ? `<p style="text-align: center;"><a href="${data.actionUrl}" class="button">Start Assessment Now</a></p>` : ""}
        
        <p>Good luck!</p>
        <p>Best regards,<br><strong>${data.companyName} Recruitment Team</strong></p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Qalio Assessment Portal.
      </div>
    </div>
  </body>
  </html>
  `;
};
