import { Grid, Typography, Paper, Box } from '@mui/material';

const AuditLogs = () => {
    return (
        <Grid container px={3.75} spacing={3.75}>
            <Grid item xs={12}>
                <Typography variant="h3" mb={3}>
                    Audit Logs
                </Typography>
                <Paper sx={{ p: 3 }}>
                    <Box textAlign="center" py={5}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Audit Trail Coming Soon
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Track all user and admin activities with complete audit trail
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default AuditLogs;
