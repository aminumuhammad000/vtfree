import mongoose from 'mongoose';

const ZainboxSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    zainboxCode: { type: String, required: true, unique: true },
    zainboxName: { type: String, required: true }
});

const Zainbox = mongoose.model('Zainbox', ZainboxSchema);

async function checkZainboxes() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/vtpay');
        const zainboxes = await Zainbox.find({});
        console.log('Zainboxes:', JSON.stringify(zainboxes, null, 2));
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkZainboxes();
