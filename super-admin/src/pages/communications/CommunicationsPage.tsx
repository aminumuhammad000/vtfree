import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Select, MenuItem, Chip, Stack, Alert } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

const CommunicationsPage = () => {
    const [recipientType, setRecipientType] = useState<'all' | 'active' | 'specific'>('all');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    // Mock users data
    const users = [
        { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'pending' },
        { id: '3', name: 'Mike Johnson', email: 'mike@example.com', status: 'suspended' },
    ];

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setSuccess(false);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setSending(false);
        setSuccess(true);
        setSubject('');
        setMessage('');
        setRecipientType('all');
        setSelectedUsers([]);

        setTimeout(() => setSuccess(false), 3000);
    };

    return (
        <Box p={3}>
            <Typography variant="h4" fontWeight="bold" mb={1} color="text.primary">
                Communications
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
                Send email announcements and notifications to users
            </Typography>

            <Grid container spacing={3}>
                {/* Compose Email Form */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        {success && (
                            <Alert severity="success" sx={{ mb: 3 }}>
                                Email sent successfully!
                            </Alert>
                        )}

                        <form onSubmit={handleSend}>
                            <Stack spacing={3}>
                                <FormControl>
                                    <FormLabel id="recipient-type-label" sx={{ mb: 1, fontWeight: 600 }}>Recipients</FormLabel>
                                    <RadioGroup
                                        row
                                        aria-labelledby="recipient-type-label"
                                        name="recipientType"
                                        value={recipientType}
                                        onChange={(e) => setRecipientType(e.target.value as any)}
                                    >
                                        <FormControlLabel value="all" control={<Radio />} label="All Users" />
                                        <FormControlLabel value="active" control={<Radio />} label="Active Users Only" />
                                        <FormControlLabel value="specific" control={<Radio />} label="Specific Users" />
                                    </RadioGroup>
                                </FormControl>

                                {recipientType === 'specific' && (
                                    <FormControl fullWidth>
                                        <FormLabel sx={{ mb: 1, fontWeight: 600 }}>Select Users</FormLabel>
                                        <Select
                                            multiple
                                            value={selectedUsers}
                                            onChange={(e) => setSelectedUsers(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((value) => {
                                                        const user = users.find(u => u.id === value);
                                                        return <Chip key={value} label={user?.name} size="small" />;
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {users.map((user) => (
                                                <MenuItem key={user.id} value={user.id}>
                                                    {user.name} ({user.email}) - {user.status}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}

                                <TextField
                                    fullWidth
                                    label="Subject"
                                    required
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    variant="outlined"
                                />

                                <TextField
                                    fullWidth
                                    label="Message Body"
                                    required
                                    multiline
                                    rows={8}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    variant="outlined"
                                />

                                <Box display="flex" justifyContent="flex-end">
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        disabled={sending}
                                        startIcon={!sending && <IconifyIcon icon="lucide:send" />}
                                        sx={{ px: 4, py: 1.5 }}
                                    >
                                        {sending ? 'Sending...' : 'Send Email'}
                                    </Button>
                                </Box>
                            </Stack>
                        </form>
                    </Paper>
                </Grid>

                {/* Sidebar / Info */}
                <Grid item xs={12} lg={4}>
                    <Stack spacing={3}>
                        <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.light' }}>
                            <Typography variant="h6" color="info.main" mb={2}>
                                Email Guidelines
                            </Typography>
                            <Stack spacing={1}>
                                {['Keep subject lines clear and concise.', 'Use professional language.', 'Double-check recipients.', 'Avoid sensitive info.'].map((item, index) => (
                                    <Stack key={index} direction="row" spacing={1} alignItems="start">
                                        <Typography variant="body2" color="info.main">•</Typography>
                                        <Typography variant="body2" color="info.dark">{item}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </Paper>

                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="h6" mb={2}>
                                Recent Communications
                            </Typography>
                            <Stack spacing={2}>
                                {[1, 2, 3].map((i) => (
                                    <Box key={i} sx={{ pb: 2, borderBottom: i < 3 ? '1px solid' : 'none', borderColor: 'divider' }}>
                                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                            <Typography variant="subtitle2">System Update</Typography>
                                            <Typography variant="caption" color="text.secondary">2d ago</Typography>
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary" noWrap mb={1}>
                                            Scheduled maintenance on payment gateway...
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            <Chip label="All Users" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                                            <Chip label="Sent" color="success" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                                        </Stack>
                                    </Box>
                                ))}
                            </Stack>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CommunicationsPage;
