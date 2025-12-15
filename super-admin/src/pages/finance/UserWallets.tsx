import { Grid, Typography, Paper, Box } from '@mui/material';

const UserWallets = () => {
    return (
        <Grid container px={3.75} spacing={3.75}>
            <Grid item xs={12}>
                <Typography variant="h3" mb={3}>
                    User Wallets
                </Typography>
                <Paper sx={{ p: 3 }}>
                    <Box textAlign="center" py={5}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            User Wallet Management Coming Soon
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage individual user wallets, credit/debit, and view transaction history
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default UserWallets;
