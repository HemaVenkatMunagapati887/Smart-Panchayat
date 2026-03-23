const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Configure Gmail Transporter
 * Using App Passwords for security
 */
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
    if (error) {
        logger.error(`[Email Config] Verification failed: ${error.message}`);
    } else {
        logger.info('🚀 [Email Config] Server is ready to take our messages');
    }
});

/**
 * Send Email helper
 */
const sendEmail = async (options) => {
    logger.debug(`Attempting to send email to: ${options.email}`);
    try {
        const mailOptions = {
            from: `"Smart Panchayat Support" <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            html: options.html,
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`✅ Email sent successfully! MessageID: ${info.messageId}`);
        return info;
    } catch (err) {
        logger.error(`❌ Email delivery failed for ${options.email}: ${err.message}`);
        if (err.stack) logger.debug(err.stack);
        return null;
    }
};

/**
 * Template for Complaint Submission
 */
const sendComplaintFiledEmail = async (userEmail, userName, complaintId, title) => {
    const subject = `Complaint Registered - [${complaintId}]`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: #0f172a; padding: 24px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">Smart Panchayat</h1>
            </div>
            <div style="padding: 32px; background: #ffffff;">
                <h2 style="color: #1e293b; margin-top: 0;">Hello ${userName},</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                    Your complaint has been successfully registered on the GramSeva Digital portal.
                </p>
                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <div style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Complaint ID</div>
                    <div style="font-family: monospace; font-size: 20px; color: #1e293b; font-weight: 900; letter-spacing: 1px;">${complaintId}</div>
                    <div style="margin-top: 12px; font-size: 14px; color: #475569;"><strong>Subject:</strong> ${title}</div>
                </div>
                <p style="color: #475569; line-height: 1.6; font-size: 15px;">
                    Our staff will review your grievance within 24–48 hours. You can track the progress using your Complaint ID in the mobile app or web portal.
                </p>
                <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
                    <p style="font-size: 13px; color: #94a3b8; font-style: italic;">
                        This is an automated notification. Please do not reply directly to this email.
                    </p>
                </div>
            </div>
        </div>
    `;
    return sendEmail({ email: userEmail, subject, html });
};

/**
 * Template for Complaint Resolution
 */
const sendComplaintResolvedEmail = async (userEmail, userName, complaintId, title) => {
    const subject = `Complaint Resolved - [${complaintId}]`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: #059669; padding: 24px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">Action Completed</h1>
            </div>
            <div style="padding: 32px; background: #ffffff;">
                <h2 style="color: #1e293b; margin-top: 0;">Great news, ${userName}!</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                    Your complaint regarding <strong>"${title}"</strong> has been marked as <strong>Resolved</strong> by our staff.
                </p>
                <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
                    <span style="font-size: 32px;">✅</span>
                    <div style="font-size: 14px; color: #065f46; font-weight: 700; margin-top: 8px;">COMPLAINT RESOLVED</div>
                    <div style="font-size: 12px; color: #059669; margin-top: 4px;">ID: ${complaintId}</div>
                </div>
                <p style="color: #475569; line-height: 1.6; font-size: 15px;">
                    If you are not satisfied with the resolution, you can reopen the ticket or visit the Panchayat office for further clarification.
                </p>
                <div style="margin-top: 32px; text-align: center;">
                    <a href="#" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700;">View Details</a>
                </div>
            </div>
        </div>
    `;
    return sendEmail({ email: userEmail, subject, html });
};

module.exports = {
    sendComplaintFiledEmail,
    sendComplaintResolvedEmail
};
