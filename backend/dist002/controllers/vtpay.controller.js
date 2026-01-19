import { VTPayService } from '../services/vtpay.service.js';
export const createVirtualAccount = async (req, res) => {
    try {
        const result = await VTPayService.createVirtualAccount(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create virtual account',
        });
    }
};
export const getVirtualAccounts = async (req, res) => {
    try {
        const result = await VTPayService.getVirtualAccounts();
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch virtual accounts',
        });
    }
};
export const getAccountBalance = async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const result = await VTPayService.getAccountBalance(accountNumber);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch account balance',
        });
    }
};
export const getTransactions = async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const result = await VTPayService.getTransactions(accountNumber);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch transactions',
        });
    }
};
