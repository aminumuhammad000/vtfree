import LogsPage from '../../components/logs/LogsPage';

const AuditLogs = () => {
    const mockLogs = [
        {
            id: 'AUD-001',
            timestamp: '2025-12-16 11:45 AM',
            level: 'info' as const,
            action: 'User Login',
            user: 'admin@vtfree.com',
            ipAddress: '192.168.1.10',
            details: 'Super admin logged in successfully',
        },
        {
            id: 'AUD-002',
            timestamp: '2025-12-16 11:30 AM',
            level: 'warning' as const,
            action: 'Failed Login Attempt',
            user: 'unknown',
            ipAddress: '45.88.123.45',
            details: 'Multiple failed login attempts detected from suspicious IP',
        },
        {
            id: 'AUD-003',
            timestamp: '2025-12-16 11:15 AM',
            level: 'success' as const,
            action: 'User Created',
            user: 'admin@vtfree.com',
            ipAddress: '192.168.1.10',
            details: 'New user account created: adebayo.j@example.com',
        },
        {
            id: 'AUD-004',
            timestamp: '2025-12-16 10:50 AM',
            level: 'info' as const,
            action: 'Settings Updated',
            user: 'admin@vtfree.com',
            ipAddress: '192.168.1.10',
            details: 'Platform transaction fee updated from 2.0% to 2.5%',
        },
        {
            id: 'AUD-005',
            timestamp: '2025-12-16 10:30 AM',
            level: 'error' as const,
            action: 'Unauthorized Access Attempt',
            user: 'unknown',
            ipAddress: '23.45.67.89',
            details: 'Attempted access to admin panel without proper credentials',
        },
    ];

    return (<LogsPage
        title="Audit Logs"
        description="Complete audit trail of all user and admin activities"
        logs={mockLogs}
        icon="solar:document-text-bold"
    />
    );
};

export default AuditLogs;
