import { SystemConfig } from '../models/index.js';
import { configService } from '../services/config.service.js';
export const getAllConfigs = async (req, res) => {
    try {
        const configs = await SystemConfig.find({}).sort({ group: 1, key: 1 });
        res.json({ success: true, data: configs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const updateConfig = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        const config = await SystemConfig.findOne({ key });
        if (!config) {
            return res.status(404).json({ success: false, message: 'Config not found' });
        }
        if (!config.is_editable) {
            return res.status(403).json({ success: false, message: 'This config is not editable' });
        }
        await configService.set(key, value);
        res.json({ success: true, message: 'Config updated successfully', data: { key, value } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const createConfig = async (req, res) => {
    try {
        const { key, value, description, group } = req.body;
        const exists = await SystemConfig.findOne({ key });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Config key already exists' });
        }
        await SystemConfig.create({
            key,
            value,
            description,
            group: group || 'GENERAL'
        });
        await configService.refresh();
        res.json({ success: true, message: 'Config created successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const deleteConfig = async (req, res) => {
    try {
        const { key } = req.params;
        const config = await SystemConfig.findOne({ key });
        if (!config) {
            return res.status(404).json({ success: false, message: 'Config not found' });
        }
        if (!config.is_editable) {
            return res.status(403).json({ success: false, message: 'This config is not editable' });
        }
        // "Delete" by clearing the value, keeping the key as requested
        await configService.set(key, '');
        res.json({ success: true, message: 'Config value cleared successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
