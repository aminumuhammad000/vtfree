import { Grid, Typography, Paper, Box } from '@mui/material';

const Withdrawals = () => {
    return (
        <Grid container px={3.75} spacing={3.75}>
            <Grid item xs={12}>
                <Typography variant="h3" mb={3}>
                    Withdrawal Requests
                </Typography>
                <Paper sx={{ p: 3 }}>
                    <Box textAlign="center" py={5}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Withdrawal Management Coming Soon
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Review, approve, reject, and process withdrawal requests
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default Withdrawals;
