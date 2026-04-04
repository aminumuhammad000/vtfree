import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/amee/Desktop/vtfree/backend/.env' });

async function checkApp() {
  await mongoose.connect(process.env.MONGO_URI);
  const app = await mongoose.connection.collection('created_apps').findOne({ app_id: 'dadsub' });
  console.log("App 'dadsub' config:", JSON.stringify(app, null, 2));
  
  if (app?.payment_settings?.vtstack_secret_key) {
    console.log("VTStack Secret Key matches user script:", app.payment_settings.vtstack_secret_key === "sk_live_REMOVED");
  } else {
    console.log("VTStack Secret Key not found for app 'dadsub'");
  }

  process.exit(0);
}
checkApp().catch(console.error);
