import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import SuperAdmin from '../models/super_admin.model.js';
import CreatedApp from '../models/created_app.model.js';
import VTfreeUser from '../models/vtfree_user.model.js';

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const admin = await SuperAdmin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                user_id: admin._id,
                email: admin.email,
                type: 'super_admin',
                role: admin.role
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            data: {
                admin: {
                    _id: admin._id,
                    email: admin.email,
                    role: admin.role,
                },
                token,
            },
        });
    } catch (error) {
        console.error('Super admin login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllApps = async (req: Request, res: Response) => {
    try {
        const apps = await CreatedApp.find().sort({ created_at: -1 }).populate('owner_id', 'email first_name last_name');
        res.json({ success: true, data: { apps } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await VTfreeUser.find().sort({ created_at: -1 });
        res.json({ success: true, data: { users } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
