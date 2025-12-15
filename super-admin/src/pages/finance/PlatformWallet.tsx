import { Grid, Typography, Paper, Box } from '@mui/material';

const PlatformWallet = () => {
    return (
        <Grid container px={3.75} spacing={3.75}>
            <Grid item xs={12}>
                <Typography variant="h3" mb={3}>
                    Platform Wallet
                </Typography>
                <Paper sx={{ p: 3 }}>
                    <Box textAlign="center" py={5}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Platform Wallet Dashboard Coming Soon
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            View total platform balance, earnings, and revenue analytics
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default PlatformWallet;
