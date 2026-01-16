import mongoose from 'mongoose';

async function prune() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/vtfree');

        const VirtualAccount = mongoose.model('VirtualAccount', new mongoose.Schema({}, { strict: false }));
        const AppAdmin = mongoose.model('AppAdmin', new mongoose.Schema({}, { strict: false }));

        const targetAdmin = await AppAdmin.findOne({ email: 'admin@vtuapp.com' });
        const otherAdmin = await AppAdmin.findOne({ email: 'admin@testvtuapp.com' });

        if (!targetAdmin || !otherAdmin) {
            console.log('Admins not found');
            return;
        }

        const accounts = await VirtualAccount.find({ generatedBy: targetAdmin._id }).sort({ createdAt: 1 });
        console.log(`Admin ${targetAdmin.email} has ${accounts.length} accounts`);

        if (accounts.length > 2) {
            const toMove = accounts.slice(0, accounts.length - 2);
            const idsToMove = toMove.map(a => a._id);

            const result = await VirtualAccount.updateMany(
                { _id: { $in: idsToMove } },
                { $set: { generatedBy: otherAdmin._id } }
            );

            console.log(`Moved ${result.modifiedCount} accounts to ${otherAdmin.email}`);
            console.log(`Left 2 accounts for ${targetAdmin.email}`);
        } else {
            console.log('Already has 2 or fewer accounts');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}
prune();
