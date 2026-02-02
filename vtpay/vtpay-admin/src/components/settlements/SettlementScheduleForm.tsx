import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import toast from 'react-hot-toast';

interface SettlementAccount {
    accountNumber: string;
    bankCode: string;
    percentage: string;
}

interface SettlementScheduleFormProps {
    zainboxCode: string;
    onSuccess?: () => void;
}

const SCHEDULE_TYPES = [
    { value: 'T1', label: 'T1 - Daily (Next working day)', periods: ['Daily'] },
    { value: 'T7', label: 'T7 - Weekly', periods: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    { value: 'T30', label: 'T30 - Monthly', periods: Array.from({ length: 30 }, (_, i) => `${i + 1}`).concat(['lastDayOfMonth']) }
];

export const SettlementScheduleForm: React.FC<SettlementScheduleFormProps> = ({ zainboxCode, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [loadingSchedule, setLoadingSchedule] = useState(true);
    const [currentSchedule, setCurrentSchedule] = useState<any>(null);

    const [scheduleType, setScheduleType] = useState<'T1' | 'T7' | 'T30'>('T1');
    const [schedulePeriod, setSchedulePeriod] = useState('Daily');
    const [settlementAccounts, setSettlementAccounts] = useState<SettlementAccount[]>([
        { accountNumber: '', bankCode: '058', percentage: '100' }
    ]);
    const [enabled, setEnabled] = useState(true);
    const [banks, setBanks] = useState<any[]>([]);

    useEffect(() => {
        fetchCurrentSchedule();
        fetchBanks();
    }, [zainboxCode]);

    useEffect(() => {
        // Update period when schedule type changes
        const selectedType = SCHEDULE_TYPES.find(t => t.value === scheduleType);
        if (selectedType) {
            setSchedulePeriod(selectedType.periods[0]);
        }
    }, [scheduleType]);

    const fetchCurrentSchedule = async () => {
        try {
            setLoadingSchedule(true);
            const schedule = await adminApi.getSettlementSchedule(zainboxCode);
            if (schedule) {
                setCurrentSchedule(schedule);
                setScheduleType(schedule.scheduleType);
                setSchedulePeriod(schedule.schedulePeriod);
                setSettlementAccounts(schedule.settlementAccounts || []);
                setEnabled(true); // If schedule exists, it's enabled
            }
        } catch (error: any) {
            console.error('Failed to fetch schedule:', error);
        } finally {
            setLoadingSchedule(false);
        }
    };

    const fetchBanks = async () => {
        try {
            const response: any = await adminApi.getBanks();
            const banksData = Array.isArray(response) ? response : (response?.data || []);
            setBanks(banksData);
        } catch (error) {
            console.error('Failed to fetch banks:', error);
        }
    };

    const addAccount = () => {
        setSettlementAccounts([...settlementAccounts, { accountNumber: '', bankCode: '058', percentage: '0' }]);
    };

    const removeAccount = (index: number) => {
        if (settlementAccounts.length > 1) {
            setSettlementAccounts(settlementAccounts.filter((_, i) => i !== index));
        }
    };

    const updateAccount = (index: number, field: keyof SettlementAccount, value: string) => {
        const updated = [...settlementAccounts];
        updated[index] = { ...updated[index], [field]: value };
        setSettlementAccounts(updated);
    };

    const getTotalPercentage = () => {
        return settlementAccounts.reduce((sum, acc) => sum + parseFloat(acc.percentage || '0'), 0);
    };

    const validateForm = (): string | null => {
        // Check if all accounts have required fields
        for (const acc of settlementAccounts) {
            if (!acc.accountNumber || acc.accountNumber.length !== 10) {
                return 'All account numbers must be 10 digits';
            }
            if (!acc.bankCode) {
                return 'All accounts must have a bank selected';
            }
            if (!acc.percentage || parseFloat(acc.percentage) <= 0) {
                return 'All percentages must be greater than 0';
            }
        }

        // Check total percentage
        const total = getTotalPercentage();
        if (Math.abs(total - 100) > 0.01) {
            return `Total percentage must equal 100%. Current: ${total.toFixed(2)}%`;
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const error = validateForm();
        if (error) {
            toast.error(error);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: `${scheduleType}-settlement-${Date.now()}`,
                scheduleType,
                schedulePeriod,
                settlementAccountList: settlementAccounts,
                status: enabled
            };

            await adminApi.createSettlementSchedule(zainboxCode, payload);
            toast.success('Settlement schedule configured successfully');
            fetchCurrentSchedule();
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to configure settlement schedule');
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async () => {
        if (!confirm('Are you sure you want to deactivate the settlement schedule?')) {
            return;
        }

        setLoading(true);
        try {
            await adminApi.deactivateSettlementSchedule(zainboxCode);
            toast.success('Settlement schedule deactivated');
            setCurrentSchedule(null);
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to deactivate settlement schedule');
        } finally {
            setLoading(false);
        }
    };

    if (loadingSchedule) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const totalPercentage = getTotalPercentage();
    const isValidTotal = Math.abs(totalPercentage - 100) < 0.01;
    const selectedType = SCHEDULE_TYPES.find(t => t.value === scheduleType);

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Settlement Schedule Configuration</h3>
                {currentSchedule && (
                    <button
                        onClick={handleDeactivate}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
                    >
                        Deactivate Schedule
                    </button>
                )}
            </div>

            {currentSchedule && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                        <strong>Current Schedule:</strong> {currentSchedule.scheduleType} - {currentSchedule.schedulePeriod}
                        {currentSchedule.settlementAccounts && ` (${currentSchedule.settlementAccounts.length} accounts)`}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Schedule Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Schedule Type
                    </label>
                    <div className="space-y-2">
                        {SCHEDULE_TYPES.map((type) => (
                            <label key={type.value} className="flex items-center">
                                <input
                                    type="radio"
                                    name="scheduleType"
                                    value={type.value}
                                    checked={scheduleType === type.value}
                                    onChange={(e) => setScheduleType(e.target.value as any)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="ml-3 text-sm text-gray-700">{type.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Schedule Period */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Schedule Period
                    </label>
                    <select
                        value={schedulePeriod}
                        onChange={(e) => setSchedulePeriod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {selectedType?.periods.map((period) => (
                            <option key={period} value={period}>{period}</option>
                        ))}
                    </select>
                </div>

                {/* Settlement Accounts */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Settlement Accounts
                    </label>
                    <div className="space-y-4">
                        {settlementAccounts.map((account, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-md bg-gray-50">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-700">Account {index + 1}</span>
                                    {settlementAccounts.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeAccount(index)}
                                            className="text-sm text-red-600 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Account Number</label>
                                        <input
                                            type="text"
                                            value={account.accountNumber}
                                            onChange={(e) => updateAccount(index, 'accountNumber', e.target.value)}
                                            placeholder="1234567890"
                                            maxLength={10}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Bank</label>
                                        <select
                                            value={account.bankCode}
                                            onChange={(e) => updateAccount(index, 'bankCode', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {banks.map((bank) => (
                                                <option key={bank.code} value={bank.code}>
                                                    {bank.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Percentage (%)</label>
                                        <input
                                            type="number"
                                            value={account.percentage}
                                            onChange={(e) => updateAccount(index, 'percentage', e.target.value)}
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addAccount}
                        className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50"
                    >
                        + Add Account
                    </button>
                </div>

                {/* Total Percentage */}
                <div className={`p-4 rounded-md ${isValidTotal ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`text-sm font-medium ${isValidTotal ? 'text-green-800' : 'text-red-800'}`}>
                        Total Allocation: {totalPercentage.toFixed(2)}% {isValidTotal ? '✓' : '✗ Must equal 100%'}
                    </p>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="enabled"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">
                        Enable settlement schedule
                    </label>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || !isValidTotal}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : currentSchedule ? 'Update Schedule' : 'Create Schedule'}
                    </button>
                </div>
            </form>
        </div>
    );
};
