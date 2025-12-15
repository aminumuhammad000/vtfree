import { Grid, Typography, Paper, Box } from '@mui/material';

const Support = () => {
    return (
        <Grid container px={3.75} spacing={3.75}>
            <Grid item xs={12}>
                <Typography variant="h3" mb={3}>
                    Support & Ticketing
                </Typography>
                <Paper sx={{ p: 3 }}>
                    <Box textAlign="center" py={5}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Support System Coming Soon
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage support tickets, user issues, and customer inquiries
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default Support;
