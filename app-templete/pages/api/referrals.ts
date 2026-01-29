import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { Referral } from '../../models/Referral';

// Connect to MongoDB
const connectDB = async () => {
    if (mongoose.connections[0].readyState) return;
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vtfree');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await connectDB();

    if (req.method === 'POST') {
        try {
            const { referrerId, referredUserId } = req.body;
            const referral = await Referral.create({ referrerId, referredUserId });
            res.status(201).json({ success: true, data: referral });
        } catch (error) {
            res.status(400).json({ success: false, error: 'Failed to create referral' });
        }
    } else if (req.method === 'GET') {
        try {
            const { userId } = req.query;
            const referrals = await Referral.find({ referrerId: userId });
            res.status(200).json({ success: true, data: referrals });
        } catch (error) {
            res.status(400).json({ success: false, error: 'Failed to fetch referrals' });
        }
    } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
    }
}
