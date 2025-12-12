import { Response } from 'express';
import { Dispute } from '../models/dispute.model.js';
import { ApiResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export class DisputeController {
    static async createDispute(req: AuthRequest, res: Response) {
        try {
            const { transaction_id, reason } = req.body;
            const user_id = req.user?.id;

            const dispute = await Dispute.create({
                transaction_id,
                user_id,
                reason,
                status: 'open'
            });

            return ApiResponse.success(res, dispute, 'Dispute created successfully', 201);
        } catch (error: any) {
            return ApiResponse.error(res, error.message, 500);
        }
    }

    static async getDisputes(req: AuthRequest, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const filter: any = {};
            if (req.query.status) filter.status = req.query.status;

            if (req.query.search) {
                const searchRegex = new RegExp(req.query.search as string, 'i');
                filter.$or = [
                    { reason: searchRegex },
                    { resolution_notes: searchRegex }
                ];
            }

            const disputes = await Dispute.find(filter)
                .populate('user_id', 'first_name last_name email')
                .populate('transaction_id')
                .populate('admin_id', 'first_name last_name')
                .skip(skip)
                .limit(limit)
                .sort({ created_at: -1 });

            const total = await Dispute.countDocuments(filter);

            return ApiResponse.paginated(res, disputes, {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }, 'Disputes retrieved successfully');
        } catch (error: any) {
            return ApiResponse.error(res, error.message, 500);
        }
    }

    static async getDisputeById(req: AuthRequest, res: Response) {
        try {
            const dispute = await Dispute.findById(req.params.id)
                .populate('user_id', 'first_name last_name email')
                .populate('transaction_id')
                .populate('admin_id', 'first_name last_name');

            if (!dispute) {
                return ApiResponse.error(res, 'Dispute not found', 404);
            }

            return ApiResponse.success(res, dispute, 'Dispute retrieved successfully');
        } catch (error: any) {
            return ApiResponse.error(res, error.message, 500);
        }
    }

    static async resolveDispute(req: AuthRequest, res: Response) {
        try {
            const { status, resolution_notes } = req.body;
            const admin_id = req.user?.id; // Assuming admin is logged in

            if (!['resolved', 'rejected'].includes(status)) {
                return ApiResponse.error(res, 'Invalid status', 400);
            }

            const dispute = await Dispute.findByIdAndUpdate(
                req.params.id,
                {
                    status,
                    resolution_notes,
                    admin_id, // Track which admin resolved it
                    updated_at: new Date()
                },
                { new: true }
            );

            if (!dispute) {
                return ApiResponse.error(res, 'Dispute not found', 404);
            }

            return ApiResponse.success(res, dispute, 'Dispute resolved successfully');
        } catch (error: any) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
}
