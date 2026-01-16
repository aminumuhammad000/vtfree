import mongoose from 'mongoose';

async function check() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/vtfree');
        const CreatedApp = mongoose.model('CreatedApp', new mongoose.Schema({ app_id: String, owner_id: mongoose.Types.ObjectId }));
        const VTfreeUser = mongoose.model('VTfreeUser', new mongoose.Schema({ email: String }));

        const apps = await CreatedApp.find({}).limit(5);
        console.log('Apps:', JSON.stringify(apps, null, 2));

        const users = await VTfreeUser.find({}).limit(5);
        console.log('Users:', JSON.stringify(users, null, 2));

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}
check();
