import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Zainbox } from '../models';
import { zainpayService } from '../services';
import config from '../config';

dotenv.config();

const migrateZainboxes = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.mongodbUri);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Found ${users.length} users to check.`);

        let createdCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const user of users) {
            try {
                // Check if user already has a Zainbox
                const existingZainbox = await Zainbox.findOne({ userId: user._id });

                if (existingZainbox) {
                    console.log(`User ${user.email} already has a Zainbox. Skipping.`);
                    skippedCount++;
                    continue;
                }

                console.log(`Creating Zainbox for user ${user.email}...`);

                const zainboxName = user.businessName || `${user.fullName}'s Zainbox`;
                // Use a default callback URL if config is missing, but prefer config
                const callbackUrl = config.webhookBaseUrl
                    ? `${config.webhookBaseUrl}/api/webhooks/zainpay`
                    : 'https://vtpay-server.onrender.com/api/webhooks/zainpay';

                const payload = {
                    name: zainboxName,
                    emailNotification: user.email,
                    tags: "vtpay_user_migration",
                    callbackUrl: callbackUrl
                };

                console.log('Creating Zainbox for user:', payload);
                const response = await zainpayService.createZainbox(payload);
                console.log('Zainpay API Response:', JSON.stringify(response, null, 2));

                if (response.code === '00' && response.data) {
                    const zainboxData = Array.isArray(response.data) ? response.data[0] : response.data;
                    console.log('Extracted Zainbox Data:', JSON.stringify(zainboxData, null, 2));

                    if (zainboxData) {
                        // Ensure all required fields are present, falling back to payload if needed
                        const newZainbox = new Zainbox({
                            userId: user._id,
                            name: zainboxData.name || payload.name,
                            emailNotification: zainboxData.emailNotification || payload.emailNotification,
                            tags: zainboxData.tags || payload.tags,
                            callbackUrl: zainboxData.callbackUrl || payload.callbackUrl,
                            codeName: zainboxData.codeName || `ZB-${Date.now()}`, // Fallback if not returned
                            zainboxCode: zainboxData.zainboxCode || zainboxData.codeName, // Try codeName if zainboxCode is missing
                            isLive: zainboxData.isLive !== undefined ? zainboxData.isLive : true,
                        });

                        if (!newZainbox.zainboxCode) {
                            console.error(`Missing zainboxCode for ${user.email}. Data:`, zainboxData);
                            errorCount++;
                            continue;
                        }

                        await newZainbox.save();
                        console.log(`Successfully created Zainbox for ${user.email}`);
                        createdCount++;
                    } else {
                        console.error(`Failed to parse Zainbox data for ${user.email}:`, response);
                        errorCount++;
                    }
                } else {
                    console.error(`Failed to create Zainbox for ${user.email}: ${response.description}`);
                    errorCount++;
                }

                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err: any) {
                // Check if error is due to duplicate Zainbox
                if (err.response?.data?.code === '16' || err.message.includes('already exist')) {
                    console.log(`Zainbox already exists for ${user.email}. Fetching details...`);

                    try {
                        const listResponse = await zainpayService.listZainboxes();
                        if (listResponse.code === '00' && listResponse.data) {
                            const allZainboxes = listResponse.data;
                            console.log('Sample Zainbox from list:', JSON.stringify(allZainboxes[0], null, 2));

                            // Find matching Zainbox by name or email
                            const match = allZainboxes.find((z: any) =>
                                z.emailNotification === user.email ||
                                z.name === (user.businessName || `${user.fullName}'s Zainbox`)
                            );

                            if (match) {
                                console.log(`Found existing Zainbox for ${user.email}:`, match.zainboxCode || match.codeName);
                                const newZainbox = new Zainbox({
                                    userId: user._id,
                                    name: match.name,
                                    emailNotification: match.emailNotification,
                                    tags: match.tags,
                                    callbackUrl: match.callbackUrl,
                                    codeName: match.codeName,
                                    zainboxCode: match.zainboxCode || match.codeName, // Fallback to codeName
                                    isLive: match.isLive !== undefined ? match.isLive : true,
                                });
                                await newZainbox.save();
                                console.log(`Successfully linked existing Zainbox for ${user.email}`);
                                createdCount++;
                            } else {
                                console.error(`Could not find matching Zainbox in list for ${user.email}`);
                                errorCount++;
                            }
                        }
                    } catch (fetchErr: any) {
                        console.error(`Failed to fetch existing Zainboxes:`, fetchErr.message);
                        errorCount++;
                    }
                } else {
                    console.error(`Error processing user ${user.email}:`, err.message);
                    errorCount++;
                }
            }
        }

        console.log('Migration complete.');
        console.log(`Created: ${createdCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

migrateZainboxes();
