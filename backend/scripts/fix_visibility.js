import mongoose from 'mongoose';

async function fix() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/vtfree');

        const VirtualAccount = mongoose.model('VirtualAccount', new mongoose.Schema({}, { strict: false }));
        const AppAdmin = mongoose.model('AppAdmin', new mongoose.Schema({}, { strict: false }));

        const admins = await AppAdmin.find({ app_id: 'vtu_app_001' });
        const targetAdmin = admins.find(a => a.email === 'admin@vtuapp.com');

        if (targetAdmin) {
            const result = await VirtualAccount.updateMany(
                { user: new mongoose.Types.ObjectId('696a751365ea46b48e6e4d09') },
                { $set: { generatedBy: targetAdmin._id } }
            );
            console.log(`Updated ${result.modifiedCount} accounts for admin@vtuapp.com`);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}
fix();
