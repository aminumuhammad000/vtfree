import { Grid, Typography, Paper, Box } from '@mui/material';

const PricingPlans = () => {
    return (
        <Grid container px={3.75} spacing={3.75}>
            <Grid item xs={12}>
                <Typography variant="h3" mb={3}>
                    Pricing & Plans
                </Typography>
                <Paper sx={{ p: 3 }}>
                    <Box textAlign="center" py={5}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Subscription Plan Management Coming Soon
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create, edit, and manage subscription plans for platform users
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default PricingPlans;
