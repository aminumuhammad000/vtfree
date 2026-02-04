import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const MONGO_URI = 'mongodb://localhost:27017/vtfree';

async function fixPasswordCorrectCollection() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // IMPORTANT: explicitly force the collection name 'vtfreeusers'
        // The default singular->plural logic might be doing something different, so we force it.
        const VTfreeUser = mongoose.model('VTfreeUser', new mongoose.Schema({}, { strict: false }), 'vtfreeusers');

        const user = await VTfreeUser.findOne({ email: 'uteach38@gmail.com' });
        if (!user) {
            console.log('❌ User not found in vtfreeusers collection');
            process.exit(1);
        }
        console.log(`👤 Found user: ${user.email}`);

        // Generate hash
        const password = 'password123';
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        // Update
        const result = await VTfreeUser.updateOne(
            { _id: user._id },
            {
                $set: {
                    password: hashedPassword, // Field name is 'password' in this collection
                    status: 'active'
                }
            }
        );

        console.log('✅ Password updated successfully!');
        console.log(`Modified count: ${result.modifiedCount}`);

        // Verify
        const updatedUser = await VTfreeUser.findOne({ _id: user._id });
        const isMatch = await bcryptjs.compare(password, updatedUser.password);
        console.log(`🔐 Verification Check: ${isMatch ? 'PASSED' : 'FAILED'}`);

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixPasswordCorrectCollection();
