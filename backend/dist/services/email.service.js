import nodemailer from 'nodemailer';
import { configService } from './config.service.js';
export class EmailService {
    static async getTransporter() {
        const host = await configService.get('MAIL_HOST');
        const port = await configService.get('MAIL_PORT');
        const user = await configService.get('MAIL_USER');
        const pass = await configService.get('MAIL_PASSWORD');
        if (!host || !user || !pass) {
            console.warn('⚠️ Email configuration missing. Emails will not be sent.');
            return null;
        }
        return nodemailer.createTransport({
            host,
            port: parseInt(port || '587'),
            secure: parseInt(port || '587') === 465, // true for 465, false for other ports
            auth: { user, pass },
        });
    }
    static async sendEmail(to, subject, html) {
        try {
            const transporter = await this.getTransporter();
            if (!transporter)
                return false;
            const fromName = await configService.get('MAIL_FROM_NAME', 'VTU App');
            const fromAddress = await configService.get('MAIL_FROM_ADDRESS', 'noreply@example.com');
            const info = await transporter.sendMail({
                from: `"${fromName}" <${fromAddress}>`,
                to,
                subject,
                html,
            });
            console.log('📧 Email sent:', info.messageId);
            return true;
        }
        catch (error) {
            console.error('❌ Failed to send email:', error);
            return false;
        }
    }
    static async sendOTP(email, otp) {
        const subject = 'Your Verification Code';
        const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verification Code</h2>
        <p>Your OTP code is:</p>
        <h1 style="color: #0A2540; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;
        return await this.sendEmail(email, subject, html);
    }
}
