import { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Stack,
  Button,
} from '@mui/material';
import { useAuth } from 'contexts/AuthContext';
import api from 'services/api';

const Settings = () => {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Pre-fill only if user data has names (SuperAdmin model might need firstName/lastName fields if not already present)
  // For now we assume they might be added or we just update them.

  const handleUpdate = async () => {
    setLoading(true);
    setSuccessMessage('');
    try {
      const response = await api.put('/super-admin/profile', {
        first_name: firstName,
        last_name: lastName,
        password: password || undefined,
      });

      if (response.data.success) {
        setSuccessMessage('Profile updated successfully');
        setPassword('');
      }
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Typography variant="h3" mb={3}>
          Settings
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" mb={3}>
            Update Profile
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="Email"
              value={user?.email || ''}
              disabled
              fullWidth
            />
            <TextField
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
              placeholder="Enter first name"
            />
            <TextField
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
              placeholder="Enter last name"
            />
            <TextField
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              placeholder="Leave blank to keep current"
            />

            {successMessage && (
              <Typography color="success.main" variant="body2">
                {successMessage}
              </Typography>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdate}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded" // Tailwind class example
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Settings;
