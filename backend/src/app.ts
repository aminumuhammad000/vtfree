import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";

console.log('Importing adminRoutes...');
import adminRoutes from "./routes/admin.routes.js";
console.log('Importing authRoutes...');
import authRoutes from "./routes/auth.routes.js";
console.log('Importing billpaymentRoutes...');
import billpaymentRoutes from "./routes/billpayment.routes.js";
console.log('Importing notificationsRoutes...');
import notificationsRoutes from "./routes/notifications.routes.js";
console.log('Importing paymentRoutes...');
import paymentRoutes from "./routes/payment.routes.js";
console.log('Importing promotionsRoutes...');
import promotionsRoutes from "./routes/promotions.routes.js";
console.log('Importing supportRoutes...');
import supportRoutes from "./routes/support.routes.js";
console.log('Importing supportContentRoutes...');
import supportContentRoutes from "./routes/support_content.routes.js";
console.log('Importing transactionsRoutes...');
import transactionsRoutes from "./routes/transactions.routes.js";
console.log('Importing usersRoutes...');
import usersRoutes from "./routes/users.routes.js";
console.log('Importing walletRoutes...');
import walletRoutes from "./routes/wallet.routes.js";
console.log('Importing vtfreeAuthRoutes...');
import vtfreeAuthRoutes from "./routes/vtfree_auth.routes.js";
console.log('Importing vtfreeAppRoutes...');
import vtfreeAppRoutes from "./routes/vtfree_app.routes.js";
console.log('Importing vtfreeWalletRoutes...');
import vtfreeWalletRoutes from "./routes/vtfree_wallet.routes.js";
console.log('Importing appAdminRoutes...');
import appAdminRoutes from "./routes/app_admin.routes.js";
console.log('Importing superAdminRoutes...');
import superAdminRoutes from "./routes/super_admin.routes.js";
console.log('Importing publicRoutes...');
import publicRoutes from "./routes/public.routes.js";
console.log('Importing vtstackRoutes...');
import vtstackRoutes from "./routes/vtstack.routes.js";
console.log('Importing featuresRoutes...');
import featuresRoutes from "./routes/features.routes.js";
console.log('Importing webhookRoutes...');
import webhookRoutes from "./routes/webhook.routes.js";
console.log('Importing configRoutes...');
import configRoutes from "./routes/config.routes.js";
console.log('Importing virtualAccountRoutes...');
import virtualAccountRoutes from "./routes/virtualAccount.routes.js";



// Import logging middleware
import { logger } from "./config/bootstrap.js";
import { detailedRequestLogger, errorLogger, requestLogger } from "./middleware/logger.middleware.js";

dotenv.config();

const app = express();


app.use(cors({
  origin: "*", // or restrict later to your Expo dev IP if you want
}));

// For webhook routes, we need to capture the raw body for signature verification
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Parse JSON for all other routes
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ============================================
// LOGGING MIDDLEWARE
// ============================================
// Log all incoming requests with details
app.use(detailedRequestLogger);

// Morgan logger for standard HTTP request logging
app.use(requestLogger);

logger.info('VTU App Backend Starting...', {
  environment: process.env.NODE_ENV || 'development',
  nodeVersion: process.version
});

// VTfree Platform Routes
app.use("/api/v1/vtfree/auth", vtfreeAuthRoutes);
app.use("/api/v1/vtfree/apps", vtfreeAppRoutes);
app.use("/api/v1/vtfree/wallet", vtfreeWalletRoutes);
app.use("/api/v1/app-admin", appAdminRoutes);
app.use("/api/v1/super-admin", superAdminRoutes);
app.use("/api/v1/public", publicRoutes);
app.use("/api/v1/features", featuresRoutes);
app.use("/api/v1/webhooks", webhookRoutes);
app.use("/api/v1/config", configRoutes);
app.use("/api/v1/virtual-accounts", virtualAccountRoutes);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/promotions", promotionsRoutes);
app.use("/api/v1/support", supportRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/billpayment", billpaymentRoutes);
app.use("/api/vtstack", vtstackRoutes);
app.use("/api/support-content", supportContentRoutes);
app.use("/api/v1/support-content", supportContentRoutes);


// Root route
app.get("/", (req: Request, res: Response) => {
  res.send("Connecta Backend (MongoDB) is running...");
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});


// ============================================
// ERROR HANDLING
// ============================================
// Log errors
app.use(errorLogger);

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled Error:", {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    },
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

export default app;
