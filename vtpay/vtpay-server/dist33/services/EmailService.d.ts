declare class EmailService {
    private getTransporter;
    /**
     * Send a single email
     */
    sendEmail(to: string, subject: string, html: string): Promise<void>;
    /**
     * Send bulk emails
     */
    sendBulkEmail(emails: string[], subject: string, message: string): Promise<void>;
    /**
     * Send verification email
     */
    sendVerificationEmail(email: string, token: string): Promise<void>;
    /**
     * Send account approval email
     */
    sendApprovalEmail(email: string, name: string): Promise<void>;
}
export declare const emailService: EmailService;
export default EmailService;
//# sourceMappingURL=EmailService.d.ts.map