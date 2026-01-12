import nodemailer from 'nodemailer';
import { SystemSetting } from '../models/SystemSetting';
import config from '../config';

class EmailService {
    private async getTransporter() {
        const settings = await SystemSetting.findOne();
        if (!settings || !settings.emailConfig) {
            throw new Error('Email configuration not found');
        }

        const { provider, gmail, smtp } = settings.emailConfig;

        if (provider === 'gmail') {
            return nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: gmail.user,
                    pass: gmail.pass,
                },
            });
        } else {
            return nodemailer.createTransport({
                host: smtp.host,
                port: smtp.port,
                secure: smtp.secure,
                auth: {
                    user: smtp.user,
                    pass: smtp.pass,
                },
            });
        }
    }

    /**
     * Send a single email
     */
    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        try {
            const transporter = await this.getTransporter();
            const settings = await SystemSetting.findOne();
            const from = settings?.general?.supportEmail || 'noreply@vtpay.com';
            const companyName = settings?.general?.companyName || 'VTPay';

            await transporter.sendMail({
                from: `"${companyName}" <${from}>`,
                to,
                subject,
                html,
            });
            console.log(`[EmailService] Email sent to ${to}`);
        } catch (error) {
            console.error('[EmailService] Failed to send email:', error);
        }
    }

    /**
     * Send bulk emails
     */
    async sendBulkEmail(emails: string[], subject: string, message: string): Promise<void> {
        try {
            const transporter = await this.getTransporter();
            const settings = await SystemSetting.findOne();
            const from = settings?.general?.supportEmail || 'noreply@vtpay.com';
            const companyName = settings?.general?.companyName || 'VTPay';

            // Convert plain text message to simple HTML (replace newlines with <br>)
            const html = `
                <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            `;

            // Send emails in parallel or chunks
            // For simplicity, we'll send them in parallel here, but for large lists, chunks are better
            const sendPromises = emails.map(email =>
                transporter.sendMail({
                    from: `"${companyName}" <${from}>`,
                    to: email,
                    subject,
                    html,
                }).catch(err => console.error(`[EmailService] Failed to send to ${email}:`, err))
            );

            await Promise.all(sendPromises);
            console.log(`[EmailService] Bulk email process completed for ${emails.length} recipients`);
        } catch (error) {
            console.error('[EmailService] Bulk email failed:', error);
        }
    }

    /**
     * Send verification email
     */
    async sendVerificationEmail(email: string, token: string): Promise<void> {
        const verificationLink = `${config.app.url || 'http://localhost:5173'}/verify-email?token=${token}`;
        const html = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #16a34a;">Verify your VTPay Account</h2>
                <p>Welcome to VTPay! Please click the button below to verify your email address and activate your account.</p>
                <div style="margin: 30px 0;">
                    <a href="${verificationLink}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; rounded: 5px; font-weight: bold;">Verify Email Address</a>
                </div>
                <p style="color: #666; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="color: #666; font-size: 12px;">${verificationLink}</p>
            </div>
        `;
        return this.sendEmail(email, 'Verify your VTPay Account', html);
    }

    /**
     * Send account approval email
     */
    async sendApprovalEmail(email: string, name: string): Promise<void> {
        const dashboardLink = `${config.app.url || 'http://localhost:5173'}/dashboard`;
        const html = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #16a34a;">Account Approved!</h2>
                <p>Hello ${name},</p>
                <p>We are pleased to inform you that your VTPay account has been reviewed and approved. You now have full access to all our features, including:</p>
                <ul style="color: #444;">
                    <li>Live API access for payment processing</li>
                    <li>Dedicated Virtual Accounts</li>
                    <li>Instant Wallet Payouts</li>
                    <li>Developer Tools and Webhooks</li>
                </ul>
                <p>You can now log in to your dashboard to start integrating and processing payments.</p>
                <div style="margin: 30px 0; text-align: center;">
                    <a href="${dashboardLink}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
                </div>
                <p style="color: #666; font-size: 14px;">If you have any questions, feel free to reply to this email or contact our support team.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} VTPay. All rights reserved.</p>
            </div>
        `;
        return this.sendEmail(email, 'Your VTPay Account has been Approved!', html);
    }
}

export const emailService = new EmailService();
export default EmailService;
