import { Grid, Typography, Paper, Box } from '@mui/material';

const AllCustomers = () => {
    return (
        <Grid container px={3.75} spacing={3.75}>
            <Grid item xs={12}>
                <Typography variant="h3" mb={3}>
                    All Customers
                </Typography>
                <Paper sx={{ p: 3 }}>
                    <Box textAlign="center" py={5}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Customer Management Coming Soon
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            View and manage all customers across all apps and users
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default AllCustomers;
