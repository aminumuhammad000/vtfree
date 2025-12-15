import { Grid, Typography, Paper, Box } from '@mui/material';

const Providers = () => {
    return (
        <Grid container px={3.75} spacing={3.75}>
            <Grid item xs={12}>
                <Typography variant="h3" mb={3}>
                    Service Providers
                </Typography>
                <Paper sx={{ p: 3 }}>
                    <Box textAlign="center" py={5}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Provider Management Coming Soon
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage API providers, configure keys, monitor status, and control failover
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default Providers;
