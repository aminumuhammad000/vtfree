import config from '../config';

class EmailService {
    /**
     * Send verification email
     * @param email User's email address
     * @param token Verification token
     */
    async sendVerificationEmail(email: string, token: string): Promise<void> {
        const verificationLink = `${config.app.url || 'http://localhost:5173'}/verify-email?token=${token}`;

        console.log('---------------------------------------------------');
        console.log(`[EmailService] Sending verification email to: ${email}`);
        console.log(`[EmailService] Subject: Verify your VTPay Account`);
        console.log(`[EmailService] Body: Please click the link below to verify your account:`);
        console.log(`[EmailService] Link: ${verificationLink}`);
        console.log('---------------------------------------------------');

        // In a real application, we would use a library like nodemailer or an API like SendGrid/Mailgun here
        return Promise.resolve();
    }
}

export const emailService = new EmailService();
export default EmailService;
