import {
  Grid,
  Paper,
  Typography,
  TextField,
  Stack,
  Avatar,
} from '@mui/material';
import { useAuth } from 'contexts/AuthContext';
import ProfileImage from 'assets/images/Profile.png';

const Profile = () => {
  const { user } = useAuth();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Avatar
            src={ProfileImage}
            sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
          />
          <Typography variant="h5">{user?.name || 'Super Admin'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.role || 'Administrator'}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" mb={3}>
            Profile Details
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="Full Name"
              value={user?.name || 'Super Admin'}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Email Address"
              value={user?.email || ''}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Role"
              value={user?.role || ''}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Profile;
