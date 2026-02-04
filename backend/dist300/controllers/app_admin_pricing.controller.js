import AirtimePlan from '../models/airtime_plan.model.js';
import logger from '../utils/logger.js';
import { ApiResponse } from '../utils/response.js';
export class AppAdminPricingController {
    /**
     * Get all airtime/data plans for the current app (including global plans)
     */
    static async getAllPlans(req, res) {
        try {
            const app_id = req.user?.app_id;
            const { providerId, type, active } = req.query;
            const filter = {
                $or: [
                    { app_id: app_id },
                    { app_id: null },
                    { app_id: { $exists: false } }
                ]
            };
            if (providerId)
                filter.providerId = parseInt(providerId);
            if (type)
                filter.type = type;
            if (active !== undefined)
                filter.active = active === 'true';
            const plans = await AirtimePlan.find(filter).sort({ providerId: 1, type: 1, price: 1 });
            ApiResponse.success(res, 'Plans retrieved successfully', { plans, total: plans.length });
        }
        catch (error) {
            logger.error('Error getting app plans:', error);
            ApiResponse.error(res, 'Failed to retrieve plans', 500);
        }
    }
    /**
     * Get a specific plan by ID
     */
    static async getPlanById(req, res) {
        try {
            const app_id = req.user?.app_id;
            const { id } = req.params;
            const plan = await AirtimePlan.findOne({
                _id: id,
                $or: [
                    { app_id: app_id },
                    { app_id: null },
                    { app_id: { $exists: false } }
                ]
            });
            if (!plan) {
                ApiResponse.error(res, 'Plan not found', 404);
                return;
            }
            ApiResponse.success(res, 'Plan retrieved successfully', { plan });
        }
        catch (error) {
            logger.error('Error getting app plan:', error);
            ApiResponse.error(res, 'Failed to retrieve plan', 500);
        }
    }
    /**
     * Create a new airtime/data plan for the current app
     */
    static async createPlan(req, res) {
        try {
            const app_id = req.user?.app_id;
            const { providerId, providerName, externalPlanId, code, name, price, type, discount, meta, active } = req.body;
            if (!providerId || !providerName || !name || price === undefined || !type) {
                ApiResponse.error(res, 'Missing required fields', 400);
                return;
            }
            const newPlan = new AirtimePlan({
                app_id,
                providerId,
                providerName,
                externalPlanId,
                code,
                name,
                price,
                type,
                discount: discount || 0,
                meta,
                active: active !== false,
            });
            await newPlan.save();
            ApiResponse.success(res, 'Plan created successfully', { plan: newPlan }, 201);
        }
        catch (error) {
            logger.error('Error creating app plan:', error);
            ApiResponse.error(res, 'Failed to create plan', 500);
        }
    }
    /**
     * Update an existing plan
     */
    static async updatePlan(req, res) {
        try {
            const app_id = req.user?.app_id;
            const { id } = req.params;
            const { providerId, providerName, externalPlanId, code, name, price, type, discount, meta, active } = req.body;
            // Only allow updating plans that belong to this app
            const plan = await AirtimePlan.findOne({ _id: id, app_id });
            if (!plan) {
                ApiResponse.error(res, 'Plan not found or you do not have permission to edit it', 404);
                return;
            }
            if (providerId !== undefined)
                plan.providerId = providerId;
            if (providerName !== undefined)
                plan.providerName = providerName;
            if (externalPlanId !== undefined)
                plan.externalPlanId = externalPlanId;
            if (code !== undefined)
                plan.code = code;
            if (name !== undefined)
                plan.name = name;
            if (price !== undefined)
                plan.price = price;
            if (type !== undefined)
                plan.type = type;
            if (discount !== undefined)
                plan.discount = discount;
            if (meta !== undefined)
                plan.meta = meta;
            if (active !== undefined)
                plan.active = active;
            await plan.save();
            ApiResponse.success(res, 'Plan updated successfully', { plan });
        }
        catch (error) {
            logger.error('Error updating app plan:', error);
            ApiResponse.error(res, 'Failed to update plan', 500);
        }
    }
    /**
     * Delete a plan
     */
    static async deletePlan(req, res) {
        try {
            const app_id = req.user?.app_id;
            const { id } = req.params;
            // Only allow deleting plans that belong to this app
            const plan = await AirtimePlan.findOneAndDelete({ _id: id, app_id });
            if (!plan) {
                ApiResponse.error(res, 'Plan not found or you do not have permission to delete it', 404);
                return;
            }
            ApiResponse.success(res, 'Plan deleted successfully', { plan });
        }
        catch (error) {
            logger.error('Error deleting app plan:', error);
            ApiResponse.error(res, 'Failed to delete plan', 500);
        }
    }
    /**
     * Bulk import plans for the current app
     */
    static async bulkImportPlans(req, res) {
        try {
            const app_id = req.user?.app_id;
            const { plans } = req.body;
            if (!Array.isArray(plans)) {
                ApiResponse.error(res, 'plans must be an array', 400);
                return;
            }
            const formattedPlans = plans.map(p => ({
                ...p,
                app_id
            }));
            // Optional: Clear existing plans for this app before import?
            // For now, let's just append or let the user manage.
            // Usually sync means replace.
            await AirtimePlan.deleteMany({ app_id });
            const result = await AirtimePlan.insertMany(formattedPlans);
            ApiResponse.success(res, 'Plans imported successfully', { count: result.length }, 201);
        }
        catch (error) {
            logger.error('Error bulk importing app plans:', error);
            ApiResponse.error(res, 'Failed to import plans', 500);
        }
    }
    /**
     * Get plans by provider for the current app (including global plans)
     */
    static async getPlansByProvider(req, res) {
        try {
            const app_id = req.user?.app_id;
            const { providerId } = req.params;
            const { type } = req.query;
            const filter = {
                $or: [
                    { app_id: app_id },
                    { app_id: null },
                    { app_id: { $exists: false } }
                ],
                providerId: parseInt(providerId),
                active: true
            };
            if (type)
                filter.type = type;
            const plans = await AirtimePlan.find(filter).sort({ price: 1 });
            ApiResponse.success(res, 'Plans retrieved successfully', { plans, total: plans.length });
        }
        catch (error) {
            logger.error('Error getting app plans by provider:', error);
            ApiResponse.error(res, 'Failed to retrieve plans', 500);
        }
    }
}
export default AppAdminPricingController;
