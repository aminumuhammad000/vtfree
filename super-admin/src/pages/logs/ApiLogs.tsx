import LogsPage from '../../components/logs/LogsPage';

const ApiLogs = () => {
    const mockLogs = [
        {
            id: 'API-001',
            timestamp: '2025-12-16 11:45 AM',
            level: 'success' as const,
            action: 'GET /api/v1/users',
            user: 'app_user_123',
            ipAddress: '192.168.1.50',
            details: 'Successfully retrieved user list',
            endpoint: 'GET /api/v1/users',
            statusCode: 200,
        },
        {
            id: 'API-002',
            timestamp: '2025-12-16 11:40 AM',
            level: 'success' as const,
            action: 'POST /api/v1/transactions',
            user: 'app_user_456',
            ipAddress: '192.168.1.51',
            details: 'Transaction created successfully',
            endpoint: 'POST /api/v1/transactions',
            statusCode: 201,
        },
        {
            id: 'API-003',
            timestamp: '2025-12-16 11:35 AM',
            level: 'error' as const,
            action: 'GET /api/v1/wallets/999',
            user: 'app_user_789',
            ipAddress: '192.168.1.52',
            details: 'Wallet not found',
            endpoint: 'GET /api/v1/wallets/999',
            statusCode: 404,
        },
        {
            id: 'API-004',
            timestamp: '2025-12-16 11:30 AM',
            level: 'warning' as const,
            action: 'POST /api/v1/auth/login',
            user: 'unknown',
            ipAddress: '45.88.123.45',
            details: 'Rate limit exceeded for authentication endpoint',
            endpoint: 'POST /api/v1/auth/login',
            statusCode: 429,
        },
    ];

    return (
        <LogsPage
            title="API Logs"
            description="Monitor all API requests made by users' applications"
            logs={mockLogs}
            icon="solar:code-bold"
        />
    );
};

export default ApiLogs;
