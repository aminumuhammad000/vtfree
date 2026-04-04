import { Notification } from '../models/index.js';
import { NotificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/response.js';
export class NotificationController {
    static async getNotifications(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const notifications = await Notification.find({ user_id: req.user?.id })
                .skip(skip)
                .limit(limit)
                .sort({ created_at: -1 });
            const total = await Notification.countDocuments({ user_id: req.user?.id });
            const unread = await Notification.countDocuments({ user_id: req.user?.id, read_status: false });
            return ApiResponse.paginated(res, notifications, {
                page,
                limit,
                total,
                unread,
                pages: Math.ceil(total / limit)
            }, 'Notifications retrieved successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const success = await NotificationService.markAsRead(id);
            if (!success) {
                return ApiResponse.error(res, 'Notification not found', 404);
            }
            return ApiResponse.success(res, null, 'Notification marked as read');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async markAllAsRead(req, res) {
        try {
            await Notification.updateMany({ user_id: req.user?.id, read_status: false }, { read_status: true });
            return ApiResponse.success(res, null, 'All notifications marked as read');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async getNotificationById(req, res) {
        try {
            const notification = await Notification.findOne({
                _id: req.params.id,
                user_id: req.user?.id
            });
            if (!notification) {
                return ApiResponse.error(res, 'Notification not found', 404);
            }
            return ApiResponse.success(res, notification, 'Notification retrieved successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async deleteNotification(req, res) {
        try {
            const notification = await Notification.findOneAndDelete({
                _id: req.params.id,
                user_id: req.user?.id
            });
            if (!notification) {
                return ApiResponse.error(res, 'Notification not found', 404);
            }
            return ApiResponse.success(res, null, 'Notification deleted successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async deleteAllNotifications(req, res) {
        try {
            await Notification.deleteMany({ user_id: req.user?.id });
            return ApiResponse.success(res, null, 'All notifications deleted successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async sendBroadcastNotification(req, res) {
        try {
            const { title, message, type, action_link, target, userIds } = req.body;
            if (!title || !message || !type) {
                return ApiResponse.error(res, 'Title, message, and type are required', 400);
            }
            const result = await NotificationService.sendBroadcastNotification({
                title,
                message,
                type,
                action_link,
                app_id: req.user?.app_id,
                target,
                userIds
            });
            return ApiResponse.success(res, result, result.message);
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async sendBroadcastEmail(req, res) {
        try {
            const { subject, message, target, userIds } = req.body;
            const app_id = req.user?.app_id;
            if (!subject || !message) {
                return ApiResponse.error(res, 'Subject and message are required', 400);
            }
            const { User } = await import('../models/index.js');
            const { EmailService } = await import('../services/email.service.js');
            // Find users for this app
            const filter = { app_id, email: { $exists: true, $ne: '' } };
            if (target === 'selected' && userIds && userIds.length > 0) {
                filter._id = { $in: userIds };
            }
            const users = await User.find(filter);
            if (users.length === 0) {
                return ApiResponse.error(res, 'No users found to send email to', 404);
            }
            // Load app-specific email settings
            let appEmailSettings = null;
            if (app_id) {
                try {
                    const CreatedApp = (await import('../models/created_app.model.js')).default;
                    const app = await CreatedApp.findOne({ app_id });
                    if (app?.email_settings?.user && app?.email_settings?.password) {
                        appEmailSettings = {
                            provider: app.email_settings.provider,
                            host: app.email_settings.host,
                            port: app.email_settings.port,
                            user: app.email_settings.user,
                            pass: app.email_settings.password,
                            fromName: app.email_settings.from_name || app.app_name,
                            fromAddress: app.email_settings.from_address || app.email_settings.user,
                        };
                    }
                }
                catch (err) {
                    console.warn('[NotificationController] Could not load app email settings, using global config');
                }
            }
            // Send emails (in background or sequentially for now)
            let successCount = 0;
            for (const user of users) {
                let sent = false;
                if (appEmailSettings) {
                    sent = await EmailService.sendAppEmail(user.email, subject, message, appEmailSettings);
                }
                else {
                    sent = await EmailService.sendEmail(user.email, subject, message);
                }
                if (sent)
                    successCount++;
            }
            return ApiResponse.success(res, { successCount, total: users.length }, `Email broadcast sent to ${successCount} users`);
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
}
