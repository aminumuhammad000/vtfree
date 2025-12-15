import { Grid, Typography, Paper, Box } from '@mui/material';

const SecurityLogs = () => {
    return (
        <Grid container px={3.75} spacing={3.75}>
            <Grid item xs={12}>
                <Typography variant="h3" mb={3}>
                    Security Logs
                </Typography>
                <Paper sx={{ p: 3 }}>
                    <Box textAlign="center" py={5}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Security Monitoring Coming Soon
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Track security events, failed logins, and suspicious activities
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default SecurityLogs;
