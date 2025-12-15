import { Grid, Typography, Paper, Box } from '@mui/material';

const Broadcasts = () => {
    return (
        <Grid container px={3.75} spacing={3.75}>
            <Grid item xs={12}>
                <Typography variant="h3" mb={3}>
                    Broadcasts
                </Typography>
                <Paper sx={{ p: 3 }}>
                    <Box textAlign="center" py={5}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Broadcast System Coming Soon
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create and send system-wide announcements and maintenance alerts
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default Broadcasts;
