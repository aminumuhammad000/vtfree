import nodemailer from 'nodemailer';
import { configService } from './config.service.js';

interface AppEmailSettings {
    provider?: string;
    host?: string;
    port?: string;
    user?: string;
    pass?: string;
    fromName?: string;
    fromAddress?: string;
}

export class EmailService {
    private static async getTransporter() {
        const provider = await configService.get('MAIL_PROVIDER', 'other');
        let host = await configService.get('MAIL_HOST');
        let port = await configService.get('MAIL_PORT');
        const user = await configService.get('MAIL_USER');
        const pass = await configService.get('MAIL_PASSWORD');

        if (provider === 'gmail') {
            host = 'smtp.gmail.com';
            port = '465';
        }

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

    private static async getAppTransporter(emailSettings: AppEmailSettings) {
        const provider = emailSettings.provider || 'other';
        let host = emailSettings.host;
        let port = emailSettings.port;
        const user = emailSettings.user;
        const pass = emailSettings.pass;

        if (provider === 'gmail') {
            host = 'smtp.gmail.com';
            port = '465';
        }

        if (!host || !user || !pass) {
            console.warn('⚠️ App-specific email configuration missing. Emails will not be sent.');
            return null;
        }

        return nodemailer.createTransport({
            host,
            port: parseInt(port || '587'),
            secure: parseInt(port || '587') === 465, // true for 465, false for other ports
            auth: { user, pass },
        });
    }

    static async sendEmail(to: string, subject: string, html: string) {
        try {
            const transporter = await this.getTransporter();
            if (!transporter) return false;

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
        } catch (error) {
            console.error('❌ Failed to send email:', error);
            return false;
        }
    }

    static async sendAppEmail(to: string, subject: string, html: string, emailSettings: AppEmailSettings) {
        try {
            const transporter = await this.getAppTransporter(emailSettings);
            if (!transporter) return false;

            const fromName = emailSettings.fromName || 'App Notification';
            const fromAddress = emailSettings.fromAddress || 'noreply@app.com';

            const info = await transporter.sendMail({
                from: `"${fromName}" <${fromAddress}>`,
                to,
                subject,
                html,
            });

            console.log('📧 App Email sent:', info.messageId);
            return true;
        } catch (error) {
            console.error('❌ Failed to send app email:', error);
            return false;
        }
    }

    static async sendOTP(email: string, otp: string, appId?: string) {
        const subject = 'Your Verification Code';
        const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verification Code</h2>
        <p>Your OTP code is:</p>
        <h1 style="color: #0A2540; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;
        // Use app-specific email settings if app_id is provided
        if (appId) {
            try {
                const CreatedApp = (await import('../models/created_app.model.js')).default;
                const app = await CreatedApp.findOne({ app_id: appId });
                if (app && app.email_settings?.user && app.email_settings?.password) {
                    const settings: AppEmailSettings = {
                        provider: app.email_settings.provider,
                        host: app.email_settings.host,
                        port: app.email_settings.port,
                        user: app.email_settings.user,
                        pass: app.email_settings.password,
                        fromName: app.email_settings.from_name || app.app_name,
                        fromAddress: app.email_settings.from_address || app.email_settings.user,
                    };
                    return await this.sendAppEmail(email, subject, html, settings);
                }
            } catch (err) {
                console.warn(`[EmailService] Could not load app email settings for ${appId}, falling back to global config`);
            }
        }
        return await this.sendEmail(email, subject, html);
    }

    static async sendKYCApproval(email: string, userName: string, appDetails: any) {
        const primaryColor = appDetails.branding?.primary_color || '#16a34a';
        const logoUrl = appDetails.branding?.logo_url;
        const appName = appDetails.app_name || 'Our Platform';
        const companyName = appDetails.company?.name || appName;
        const companyAddress = appDetails.company?.address || '';
        const companyPhone = appDetails.company?.phone || '';

        const subject = `Congratulations! Your KYC for ${appName} is Verified`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
                    .header { background-color: ${primaryColor}; padding: 30px; text-align: center; }
                    .logo { max-width: 150px; height: auto; margin-bottom: 20px; }
                    .content { padding: 40px 30px; background-color: #ffffff; }
                    .title { color: #111827; font-size: 24px; font-weight: 800; margin-bottom: 16px; text-align: center; }
                    .body-text { color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
                    .success-badge { display: inline-block; background-color: #ecfdf5; color: #059669; padding: 8px 16px; border-radius: 9999px; font-weight: 700; font-size: 14px; margin-bottom: 20px; }
                    .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #9ca3af; font-size: 12px; }
                    .company-info { margin-bottom: 8px; font-weight: 600; color: #6b7280; }
                    .btn { display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header" style="background-color: ${primaryColor};">
                        ${logoUrl ? `<img src="${logoUrl}" alt="${appName}" class="logo">` : `<h1 style="color: white; margin: 0;">${appName}</h1>`}
                    </div>
                    <div class="content">
                        <div style="text-align: center;">
                            <div class="success-badge">Identity Verified</div>
                        </div>
                        <h2 class="title">Everything is ready, ${userName}!</h2>
                        <p class="body-text">We are excited to inform you that your KYC verification for <strong>${appName}</strong> has been approved. You now have full access to all our premium features.</p>
                        <p class="body-text">You can now fund your wallet, purchase airtime, data, and perform more transactions with ease.</p>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${appDetails.app_url || '#'}" class="btn">Get Started Now</a>
                        </div>
                    </div>
                    <div class="footer">
                        <div class="company-info">${companyName}</div>
                        ${companyAddress ? `<div>${companyAddress}</div>` : ''}
                        ${companyPhone ? `<div>Tel: ${companyPhone}</div>` : ''}
                        <div style="margin-top: 20px;">© ${new Date().getFullYear()} ${companyName}. All rights reserved.</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        if (appDetails.email_settings?.user && appDetails.email_settings?.password) {
            const settings: AppEmailSettings = {
                provider: appDetails.email_settings.provider,
                host: appDetails.email_settings.host,
                port: appDetails.email_settings.port,
                user: appDetails.email_settings.user,
                pass: appDetails.email_settings.password,
                fromName: appDetails.email_settings.from_name || appName,
                fromAddress: appDetails.email_settings.from_address || appDetails.email_settings.user,
            };
            return await this.sendAppEmail(email, subject, html, settings);
        }

        return await this.sendEmail(email, subject, html);
    }

    static async sendKYCRejection(email: string, userName: string, reason: string, appDetails: any) {
        const primaryColor = appDetails.branding?.primary_color || '#dc2626';
        const logoUrl = appDetails.branding?.logo_url;
        const appName = appDetails.app_name || 'Our Platform';

        const subject = `Action Required: KYC Verification Update for ${appName}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
                    .header { background-color: ${primaryColor}; padding: 30px; text-align: center; }
                    .logo { max-width: 150px; height: auto; margin-bottom: 20px; }
                    .content { padding: 40px 30px; background-color: #ffffff; }
                    .title { color: #111827; font-size: 24px; font-weight: 800; margin-bottom: 16px; text-align: center; }
                    .body-text { color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
                    .reason-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; }
                    .reason-title { color: #991b1b; font-weight: 700; margin-bottom: 8px; }
                    .reason-text { color: #b91c1c; }
                    .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #9ca3af; font-size: 12px; }
                    .btn { display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        ${logoUrl ? `<img src="${logoUrl}" alt="${appName}" class="logo">` : `<h1 style="color: white; margin: 0;">${appName}</h1>`}
                    </div>
                    <div class="content">
                        <h2 class="title">KYC Verification Update</h2>
                        <p class="body-text">Hi ${userName},</p>
                        <p class="body-text">We were unable to verify your identity documents for <strong>${appName}</strong> due to the following reason:</p>
                        <div class="reason-box">
                            <div class="reason-title">Reason for Rejection:</div>
                            <div class="reason-text">${reason}</div>
                        </div>
                        <p class="body-text">Please log in to your dashboard to re-submit your verification documents correctly.</p>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${appDetails.app_url || '#'}" class="btn">Re-submit Documents</a>
                        </div>
                    </div>
                    <div class="footer">
                        © ${new Date().getFullYear()} ${appName}. All rights reserved.
                    </div>
                </div>
            </body>
            </html>
        `;

        if (appDetails.email_settings?.user && appDetails.email_settings?.password) {
            const settings: AppEmailSettings = {
                provider: appDetails.email_settings.provider,
                host: appDetails.email_settings.host,
                port: appDetails.email_settings.port,
                user: appDetails.email_settings.user,
                pass: appDetails.email_settings.password,
                fromName: appDetails.email_settings.from_name || appName,
                fromAddress: appDetails.email_settings.from_address || appDetails.email_settings.user,
            };
            return await this.sendAppEmail(email, subject, html, settings);
        }

        return await this.sendEmail(email, subject, html);
    }
    static async sendAppBuildSuccess(email: string, appName: string, downloadLinks: { android?: string, web?: string }) {
        try {
            const subject = `Build Complete: ${appName} is ready!`;

            let linksHtml = '';
            if (downloadLinks.android) {
                linksHtml += `<a href="${downloadLinks.android}" class="btn" style="margin-right: 10px;">Download Android APK</a>`;
            }
            if (downloadLinks.web) {
                linksHtml += `<a href="${downloadLinks.web}" class="btn" style="background-color: #4b5563;">Download Web Bundle</a>`;
            }

            const html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #10B981;">Build Successful!</h2>
                    <p>Good news! Your app <strong>${appName}</strong> has been successfully built and is ready for download.</p>
                    <div style="margin: 30px 0;">
                        ${linksHtml}
                    </div>
                    <p>You can also access these downloads from your dashboard at any time.</p>
                    <p>Thank you for using our platform.</p>
                </div>
                <style>
                    .btn { display: inline-block; background-color: #10B981; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-bottom: 10px; }
                </style>
            `;
            return await this.sendEmail(email, subject, html);
        } catch (error) {
            console.error('[EmailService] Failed to send success email:', error);
            return false;
        }
    }

    static async sendAppBuildFailure(email: string, appName: string, errorMsg: string) {
        try {
            const subject = `Build Failed: ${appName}`;
            const html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #EF4444;">Build Failed</h2>
                    <p>Unfortunately, the build for your app <strong>${appName}</strong> encountered an error.</p>
                    <div style="background-color: #FEF2F2; color: #B91C1C; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <strong>Error Details:</strong><br/>
                        ${errorMsg}
                    </div>
                    <p>Please review your app configurations or contact support for assistance.</p>
                    <a href="#" class="btn">Go to Dashboard</a>
                </div>
                <style>
                    .btn { display: inline-block; background-color: #4b5563; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; }
                </style>
            `;
            return await this.sendEmail(email, subject, html);
        } catch (error) {
            console.error('[EmailService] Failed to send failure email:', error);
            return false;
        }
    }

    static async sendCustomBuildRequest(adminEmail: string, appDetails: any, userDetails: any) {
        try {
            const subject = `[Custom Build Request] ${appDetails.app_name} (${appDetails.package_name})`;
            const html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4F46E5;">New Custom Build Request</h2>
                    <p>User <strong>${userDetails.email}</strong> has requested a custom build for their app.</p>
                    
                    <div style="background-color: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">App Details</h3>
                        <p><strong>App Name:</strong> ${appDetails.app_name}</p>
                        <p><strong>Package Name:</strong> ${appDetails.package_name}</p>
                        <p><strong>App ID:</strong> ${appDetails.app_id}</p>
                        <p><strong>Status:</strong> ${appDetails.status}</p>
                        <p><strong>Paid Amount:</strong> ₦${appDetails.total_paid.toLocaleString()}</p>
                    </div>

                    <div style="margin-top: 20px;">
                        <p>Please review the request and proceed with the manual build process.</p>
                        <a href="https://admin.vtfree.com/apps/${appDetails.app_id}" class="btn">View in Admin Panel</a>
                    </div>
                </div>
                <style>
                    .btn { display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; }
                </style>
            `;
            return await this.sendEmail(adminEmail, subject, html);
        } catch (error) {
            console.error('[EmailService] Failed to send custom build request email:', error);
            return false;
        }
    }
}
