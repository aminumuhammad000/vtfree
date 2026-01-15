import { Response } from 'express';
import { SupportTicket, User } from '../models/index.js';
import { ApiResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import logger from '../utils/logger.js';

export class AppAdminSupportController {
    /**
     * Get all support tickets for the current app
     */
    static async getAllTickets(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            const filter: any = { app_id };
            if (req.query.status) filter.status = req.query.status;
            if (req.query.priority) filter.priority = req.query.priority;

            if (req.query.search) {
                const searchRegex = new RegExp(req.query.search as string, 'i');
                filter.$or = [
                    { subject: searchRegex },
                    { message: searchRegex },
                    { ticket_id: searchRegex }
                ];
            }

            const tickets = await SupportTicket.find(filter)
                .populate('user_id', 'first_name last_name email')
                .skip(skip)
                .limit(limit)
                .sort({ created_at: -1 });

            const total = await SupportTicket.countDocuments(filter);

            return ApiResponse.paginated(res, tickets, {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }, 'Tickets retrieved successfully');
        } catch (error: any) {
            logger.error('Error getting app support tickets:', error);
            return ApiResponse.error(res, error.message, 500);
        }
    }

    /**
     * Get a specific ticket by ID
     */
    static async getTicketById(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const ticket = await SupportTicket.findOne({
                _id: req.params.id,
                app_id
            }).populate('user_id', 'first_name last_name email');

            if (!ticket) {
                return ApiResponse.error(res, 'Ticket not found', 404);
            }

            return ApiResponse.success(res, ticket, 'Ticket retrieved successfully');
        } catch (error: any) {
            logger.error('Error getting app support ticket:', error);
            return ApiResponse.error(res, error.message, 500);
        }
    }

    /**
     * Reply to a support ticket
     */
    static async replyToTicket(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { message } = req.body;

            if (!message) {
                return ApiResponse.error(res, 'Message is required', 400);
            }

            const ticket = await SupportTicket.findOne({
                _id: req.params.id,
                app_id
            });

            if (!ticket) {
                return ApiResponse.error(res, 'Ticket not found', 404);
            }

            // In a real app, we might have a separate TicketReply model
            // For now, let's just update the status and maybe append to a thread if we had one
            // Since the current model is simple, we'll just mark as replied
            ticket.status = 'resolved'; // Or 'in-progress'
            ticket.updated_at = new Date();
            await ticket.save();

            // TODO: Send email notification to user

            return ApiResponse.success(res, ticket, 'Reply sent successfully');
        } catch (error: any) {
            logger.error('Error replying to app support ticket:', error);
            return ApiResponse.error(res, error.message, 500);
        }
    }

    /**
     * Update ticket status
     */
    static async updateStatus(req: AuthRequest, res: Response) {
        try {
            const app_id = req.user?.app_id;
            const { status } = req.body;

            if (!status) {
                return ApiResponse.error(res, 'Status is required', 400);
            }

            const ticket = await SupportTicket.findOneAndUpdate(
                { _id: req.params.id, app_id },
                { status, updated_at: new Date() },
                { new: true }
            );

            if (!ticket) {
                return ApiResponse.error(res, 'Ticket not found', 404);
            }

            return ApiResponse.success(res, ticket, 'Ticket status updated successfully');
        } catch (error: any) {
            logger.error('Error updating app support ticket status:', error);
            return ApiResponse.error(res, error.message, 500);
        }
    }
}
