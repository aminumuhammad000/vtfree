import LogsPage from '../../components/logs/LogsPage';

const ErrorLogs = () => {
    const mockLogs = [
        {
            id: 'ERR-001',
            timestamp: '2025-12-16 11:50 AM',
            level: 'error' as const,
            action: 'Database Connection Failed',
            user: 'system',
            ipAddress: 'localhost',
            details: 'Failed to connect to PostgreSQL database: Connection timeout after 30s',
        },
        {
            id: 'ERR-002',
            timestamp: '2025-12-16 11:35 AM',
            level: 'error' as const,
            action: 'Payment Provider API Error',
            user: 'payment_service',
            ipAddress: '192.168.1.100',
            details: 'Stripe API returned error: Invalid API key provided',
        },
        {
            id: 'ERR-003',
            timestamp: '2025-12-16 11:20 AM',
            level: 'warning' as const,
            action: 'Memory Usage High',
            user: 'system',
            ipAddress: 'localhost',
            details: 'Server memory usage exceeded 85% threshold',
        },
        {
            id: 'ERR-004',
            timestamp: '2025-12-16 10:55 AM',
            level: 'error' as const,
            action: 'Email Service Failure',
            user: 'notification_service',
            ipAddress: '192.168.1.101',
            details: 'Failed to send welcome email: SMTP server not responding',
        },
    ];

    return (
        <LogsPage
            title="Error Logs"
            description="View system errors, provider errors, and application issues"
            logs={mockLogs}
            icon="solar:danger-circle-bold"
        />
    );
};

export default ErrorLogs;
