import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import VTfreeUser from '../models/vtfree_user.model.js';
export const register = async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone_number, company_name } = req.body;
        // Check if user exists
        const existingUser = await VTfreeUser.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Create user
        const user = new VTfreeUser({
            email,
            password: hashedPassword,
            first_name,
            last_name,
            phone_number,
            company_name,
            status: 'active', // Auto-activate for now
            email_verified: false,
        });
        await user.save();
        // Generate token
        const token = jwt.sign({
            user_id: user._id,
            email: user.email,
            type: 'vtfree_user',
            role: 'owner'
        }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    status: user.status,
                },
                token,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await VTfreeUser.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        // Generate token
        const token = jwt.sign({
            user_id: user._id,
            email: user.email,
            type: 'vtfree_user',
            role: 'owner'
        }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        // Update last login (optional)
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    status: user.status,
                },
                token,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const getProfile = async (req, res) => {
    try {
        const user = await VTfreeUser.findById(req.user.user_id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({
            success: true,
            data: { user },
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
