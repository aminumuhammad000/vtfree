import mongoose from 'mongoose';

async function checkIndexes() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/vtfree');
        const collection = mongoose.connection.collection('virtualaccounts');
        const indexes = await collection.indexes();
        console.log('Indexes:', JSON.stringify(indexes, null, 2));

        // Find the index user_1_provider_1 and see if it's unique
        const targetIndex = indexes.find(idx => idx.name === 'user_1_provider_1');
        if (targetIndex && targetIndex.unique) {
            console.log('Index user_1_provider_1 is UNIQUE. Dropping it...');
            await collection.dropIndex('user_1_provider_1');
            console.log('Index dropped.');
        } else {
            console.log('Index user_1_provider_1 is not unique or does not exist.');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}
checkIndexes();
