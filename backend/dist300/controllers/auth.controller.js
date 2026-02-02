// controllers/auth.controller.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/bootstrap.js';
import { User } from '../models/index.js';
import CreatedApp from '../models/created_app.model.js';
import { configService } from '../services/config.service.js';
import { OTPService } from '../services/otp.service.js';
import { WalletService } from '../services/wallet.service.js';
import { ApiResponse } from '../utils/response.js';
import { userValidation } from '../utils/validators.js';
export class AuthController {
    static async register(req, res) {
        try {
            const { error } = userValidation.register.validate(req.body);
            if (error) {
                return ApiResponse.error(res, error.details[0].message, 400);
            }
            const { email, phone_number, password, first_name, last_name, referral_code, pin, app_id } = req.body;
            const existingUser = await User.findOne({ $or: [{ email }, { phone_number }] });
            if (existingUser) {
                return ApiResponse.error(res, 'User already exists', 400);
            }
            const password_hash = await bcrypt.hash(password, 10);
            const user_referral_code = Math.random().toString(36).substring(2, 10).toUpperCase();
            let referred_by;
            if (referral_code) {
                const referrer = await User.findOne({ referral_code });
                referred_by = referrer?._id;
            }
            let status = 'active';
            let appData = null;
            if (app_id) {
                appData = await CreatedApp.findOne({ app_id });
                if (appData?.require_approval) {
                    status = 'inactive';
                }
            }
            const user = await User.create({
                email,
                phone_number,
                password_hash,
                first_name,
                last_name,
                referral_code: user_referral_code,
                referred_by,
                country: 'Nigeria',
                kyc_status: 'pending',
                status,
                app_id, // Save the app_id
                transaction_pin: pin ? await bcrypt.hash(String(pin), 10) : undefined,
                profile_picture_url: `https://i.pravatar.cc/300?u=${email}`
            });
            await WalletService.createWallet(user._id);
            await OTPService.createOTP(phone_number, email, user._id.toString());
            if (status !== 'active') {
                return ApiResponse.success(res, { user }, 'Registration successful. Your account is pending approval by the administrator.', 201);
            }
            const token = jwt.sign({ id: user._id }, configService.getSync('JWT_SECRET') || config.jwtSecret, { expiresIn: configService.getSync('JWT_EXPIRY') || config.jwtExpiry });
            return ApiResponse.success(res, { user, token }, 'Registration successful', 201);
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async login(req, res) {
        try {
            console.log('Login request received:', req.body);
            const { error } = userValidation.login.validate(req.body);
            if (error) {
                console.log('Validation error:', error.details[0].message);
                return ApiResponse.error(res, error.details[0].message, 400);
            }
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            if (!user) {
                console.log('User not found:', email);
                return ApiResponse.error(res, 'Invalid credentials', 401);
            }
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                console.log('Invalid password for user:', email);
                return ApiResponse.error(res, 'Invalid credentials', 401);
            }
            if (user.status !== 'active') {
                console.log('User inactive:', email);
                return ApiResponse.error(res, 'Account is inactive', 403);
            }
            const token = jwt.sign({ id: user._id }, configService.getSync('JWT_SECRET') || config.jwtSecret, { expiresIn: configService.getSync('JWT_EXPIRY') || config.jwtExpiry });
            return ApiResponse.success(res, { user, token }, 'Login successful');
        }
        catch (error) {
            console.error('Login error:', error);
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async verifyOTP(req, res) {
        try {
            const { phone_number, otp_code } = req.body;
            const isValid = await OTPService.verifyOTP(phone_number, otp_code);
            if (!isValid) {
                return ApiResponse.error(res, 'Invalid or expired OTP', 400);
            }
            return ApiResponse.success(res, null, 'OTP verified successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async resendOTP(req, res) {
        try {
            const { phone_number, email } = req.body;
            if (!phone_number) {
                return ApiResponse.error(res, 'Phone number is required', 400);
            }
            // Try to find the user to get their email if not provided
            let userEmail = email;
            if (!userEmail) {
                const user = await User.findOne({ phone_number });
                if (user) {
                    userEmail = user.email;
                }
            }
            const otp_code = await OTPService.createOTP(phone_number, userEmail);
            return ApiResponse.success(res, null, 'OTP sent successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
}
