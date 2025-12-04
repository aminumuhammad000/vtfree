import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";

import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import billpaymentRoutes from "./routes/billpayment.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import promotionsRoutes from "./routes/promotions.routes.js";
import supportRoutes from "./routes/support.routes.js";
import supportContentRoutes from "./routes/support_content.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";
import usersRoutes from "./routes/users.routes.js";
import walletRoutes from "./routes/wallet.routes.js";



// Import logging middleware
import { logger } from "./config/bootstrap.js";
import { detailedRequestLogger, errorLogger, requestLogger } from "./middleware/logger.middleware.js";

dotenv.config();

const app = express();

// CORS Configuration
// const corsOptions = {
//   origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
//     // Allow requests with no origin (like mobile apps, curl, etc.)
//     if (!origin) return callback(null, true);

//     const allowedOrigins = [
//       'http://localhost:19006', // Expo web
//       'http://localhost:19000', // Expo dev client
//       'http://localhost:3000',  // Common React dev server
//       'http://10.0.2.2:19006',  // Android emulator
//       'exp://10.0.2.2:19000',   // Expo dev client on Android
//       'http://10.0.2.2:5000',   // Android emulator direct to backend
//       'http://localhost:5001',   // Common alternative port
//       'http://localhost:8081',   // React Native debugger
//       'http://localhost:19002',  // Expo dev tools
//       /^https?:\/\/.*\.exp\.direct$/,  // Expo tunnel URLs
//       /^https?:\/\/.*\.exp\.app$/      // Expo production URLs
//     ];

//     if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'test') {
//       return callback(null, true);
//     }

//     const msg = `The CORS policy for this site does not allow access from ${origin}`;
//     console.error('CORS Error:', msg);
//     return callback(new Error(msg), false);
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
//   credentials: true,
//   optionsSuccessStatus: 200 // Some legacy browsers choke on 204
// };

// app.use(cors(corsOptions));

app.use(cors({
  origin: "*", // or restrict later to your Expo dev IP if you want
}));

// For webhook routes, we need to capture the raw body for signature verification
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Parse JSON for all other routes
app.use(express.json());

// ============================================
// LOGGING MIDDLEWARE
// ============================================
// Log all incoming requests with details
app.use(detailedRequestLogger);

// Morgan logger for standard HTTP request logging
app.use(requestLogger);

logger.info('🚀 VTU App Backend Starting...', {
  environment: process.env.NODE_ENV || 'development',
  nodeVersion: process.version
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/promotions", promotionsRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/billpayment", billpaymentRoutes);
app.use("/api/support-content", supportContentRoutes);


// Root route
app.get("/", (req: Request, res: Response) => {
  res.send("✅ Connecta Backend (MongoDB) is running...");
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Test TopUpMate service
app.get("/api/test-topupmate", async (req: Request, res: Response) => {
  try {
    const { default: topupmateService } = await import("./services/topupmate.service.js");
    const networks = await topupmateService.getNetworks();
    res.json({ success: true, message: "TopUpMate service is working!", data: networks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "TopUpMate service error", error: error.message });
  }
});

// ============================================
// ERROR HANDLING
// ============================================
// Log errors
app.use(errorLogger);

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("❌ Unhandled Error:", {
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
