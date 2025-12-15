import { Grid, Typography, Paper, Box } from '@mui/material';

const ErrorLogs = () => {
    return (
        <Grid container px={3.75} spacing={3.75}>
            <Grid item xs={12}>
                <Typography variant="h3" mb={3}>
                    Error Logs
                </Typography>
                <Paper sx={{ p: 3 }}>
                    <Box textAlign="center" py={5}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Error Tracking Coming Soon
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            View system errors, provider errors, and application issues
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default ErrorLogs;
