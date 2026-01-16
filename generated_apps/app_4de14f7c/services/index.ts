// services/index.ts
// Central export for all API services

export { authService } from './auth.service';
export { userService } from './user.service';
export { walletService } from './wallet.service';
export { transactionService } from './transaction.service';
export { paymentService } from './payment.service';
export { notificationsService } from './notifications.service';
export { promotionsService } from './promotions.service';
export { supportService } from './support.service';
export { adminService } from './admin.service';

// Re-export types
export type {
  RegisterData,
  LoginData,
  AuthResponse,
} from './auth.service';

export type {
  UserUpdateData,
} from './user.service';

export type {
  WalletData,
  WalletResponse,
} from './wallet.service';

export type {
  Transaction,
  TransactionResponse,
  AirtimePurchaseData,
  DataPurchaseData,
} from './transaction.service';

export type {
  PaymentInitiateData,
  PaymentInitiateResponse,
  PaymentVerifyResponse,
} from './payment.service';

export type {
  Notification,
  NotificationResponse,
} from './notifications.service';

export type {
  Promotion,
  PromotionResponse,
} from './promotions.service';

export type {
  SupportTicket,
  CreateTicketData,
  TicketResponse,
} from './support.service';

export type {
  AdminUser,
  DashboardStats,
  AuditLog,
  AdminLoginData,
  AdminAuthResponse,
} from './admin.service';

// Export API instance and base URL
export { default as api, API_BASE_URL } from './api';
