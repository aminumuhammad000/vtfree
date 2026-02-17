import { Dispute } from '../models/dispute.model.js';
import { ApiResponse } from '../utils/response.js';
export class DisputeController {
    static async createDispute(req, res) {
        try {
            const { transaction_id, reason } = req.body;
            const user_id = req.user?.id;
            const app_id = req.user?.app_id;
            const dispute = await Dispute.create({
                transaction_id,
                user_id,
                app_id,
                reason,
                status: 'open'
            });
            return ApiResponse.success(res, dispute, 'Dispute created successfully', 201);
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async getDisputes(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const filter = {};
            if (req.user?.app_id) {
                filter.app_id = req.user.app_id;
            }
            if (req.query.status)
                filter.status = req.query.status;
            if (req.query.search) {
                const searchRegex = new RegExp(req.query.search, 'i');
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
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async getDisputeById(req, res) {
        try {
            const query = { _id: req.params.id };
            if (req.user?.app_id) {
                query.app_id = req.user.app_id;
            }
            const dispute = await Dispute.findOne(query)
                .populate('user_id', 'first_name last_name email')
                .populate('transaction_id')
                .populate('admin_id', 'first_name last_name');
            if (!dispute) {
                return ApiResponse.error(res, 'Dispute not found', 404);
            }
            return ApiResponse.success(res, dispute, 'Dispute retrieved successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
    static async resolveDispute(req, res) {
        try {
            const { status, resolution_notes } = req.body;
            const admin_id = req.user?.id; // Assuming admin is logged in
            if (!['resolved', 'rejected'].includes(status)) {
                return ApiResponse.error(res, 'Invalid status', 400);
            }
            const query = { _id: req.params.id };
            if (req.user?.app_id) {
                query.app_id = req.user.app_id;
            }
            const dispute = await Dispute.findOneAndUpdate(query, {
                status,
                resolution_notes,
                admin_id, // Track which admin resolved it
                updated_at: new Date()
            }, { new: true });
            if (!dispute) {
                return ApiResponse.error(res, 'Dispute not found', 404);
            }
            return ApiResponse.success(res, dispute, 'Dispute resolved successfully');
        }
        catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
}
