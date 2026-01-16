import { Request, Response } from 'express';
import { VTPayService } from '../services/vtpay.service.js';

export const createVirtualAccount = async (req: Request, res: Response) => {
    try {
        const result = await VTPayService.createVirtualAccount(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create virtual account',
        });
    }
};

export const getVirtualAccounts = async (req: Request, res: Response) => {
    try {
        const result = await VTPayService.getVirtualAccounts();
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch virtual accounts',
        });
    }
};

export const getAccountBalance = async (req: Request, res: Response) => {
    try {
        const { accountNumber } = req.params;
        const result = await VTPayService.getAccountBalance(accountNumber);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch account balance',
        });
    }
};

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const { accountNumber } = req.params;
        const result = await VTPayService.getTransactions(accountNumber);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch transactions',
        });
    }
};
