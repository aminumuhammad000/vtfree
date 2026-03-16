// services/otp.service.ts
import { config } from '../config/bootstrap.js';
import { OTP } from '../models/index.js';
export class OTPService {
    static async generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    static async createOTP(phone_number, email, user_id, app_id) {
        const otp_code = await this.generateOTP();
        const expires_at = new Date(Date.now() + config.otpExpiry);
        await OTP.create({
            user_id,
            phone_number,
            email,
            otp_code,
            expires_at,
            is_used: false
        });
        // Send email asynchronously without blocking the response
        if (email) {
            (async () => {
                try {
                    const { EmailService } = await import('./email.service.js');
                    // Use app-specific email settings if app_id is available
                    await EmailService.sendOTP(email, otp_code, app_id);
                    console.log(`✅ OTP email sent to ${email}${app_id ? ` via app ${app_id}` : ''}`);
                }
                catch (error) {
                    console.error(`❌ Failed to send OTP email to ${email}:`, error);
                }
            })();
        }
        return otp_code;
    }
    static async verifyOTP(phone_number, otp_code) {
        const otp = await OTP.findOne({
            phone_number,
            otp_code,
            is_used: false,
            expires_at: { $gt: new Date() }
        });
        if (!otp) {
            return false;
        }
        otp.is_used = true;
        await otp.save();
        return true;
    }
}
