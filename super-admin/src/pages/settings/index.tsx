import { Grid, Paper, Typography, TextField, Stack } from '@mui/material';
import { useAuth } from 'contexts/AuthContext';

const Settings = () => {
  const { user } = useAuth();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Typography variant="h3" mb={3}>
          Settings
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" mb={3}>
            Profile Information
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="Email"
              value={user?.email || ''}
              disabled
              fullWidth
            />
            <TextField
              label="Role"
              value={user?.role || ''}
              disabled
              fullWidth
            />
            {/* <Button variant="contained" color="primary">
              Save Changes
            </Button> */}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Settings;
