import LogsPage from '../../components/logs/LogsPage';

const SecurityLogs = () => {
    const mockLogs = [
        {
            id: 'SEC-001',
            timestamp: '2025-12-16 11:55 AM',
            level: 'error' as const,
            action: 'Brute Force Attack Detected',
            user: 'unknown',
            ipAddress: '45.88.123.45',
            details: '20+ failed login attempts in 5 minutes - IP blocked automatically',
        },
        {
            id: 'SEC-002',
            timestamp: '2025-12-16 11:40 AM',
            level: 'warning' as const,
            action: 'Suspicious API Activity',
            user: 'app_user_789',
            ipAddress: '192.168.1.75',
            details: 'Unusual API request pattern detected from this user',
        },
        {
            id: 'SEC-003',
            timestamp: '2025-12-16 11:25 AM',
            level: 'success' as const,
            action: '2FA Enabled',
            user: 'admin@vtfree.com',
            ipAddress: '192.168.1.10', details: 'Two-factor authentication successfully enabled for admin account',
        },
        {
            id: 'SEC-004',
            timestamp: '2025-12-16 11:10 AM',
            level: 'error' as const,
            action: 'Unauthorized Access Attempt',
            user: 'unknown',
            ipAddress: '23.45.67.89',
            details: 'Attempted to access admin panel with invalid JWT token',
        },
        {
            id: 'SEC-005',
            timestamp: '2025-12-16 10:45 AM',
            level: 'warning' as const,
            action: 'Password Reset Request',
            user: 'user@example.com',
            ipAddress: '192.168.1.60',
            details: 'Multiple password reset requests from same IP within 1 hour',
        },
    ];

    return (
        <LogsPage
            title="Security Logs"
            description="Track security events, failed logins, and suspicious activities"
            logs={mockLogs}
            icon="solar:shield-bold"
        />
    );
};

export default SecurityLogs;
