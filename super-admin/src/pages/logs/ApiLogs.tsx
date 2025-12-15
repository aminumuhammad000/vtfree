import { Grid, Typography, Paper, Box } from '@mui/material';

const ApiLogs = () => {
    return (
        <Grid container px={3.75} spacing={3.75}>
            <Grid item xs={12}>
                <Typography variant="h3" mb={3}>
                    API Logs
                </Typography>
                <Paper sx={{ p: 3 }}>
                    <Box textAlign="center" py={5}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            API Request Logs Coming Soon
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Monitor all API requests made by users' applications
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default ApiLogs;
