import { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import api from 'services/api';
import PageLoader from 'components/loader/PageLoader';

interface App {
  _id: string;
  app_name: string;
  owner_id: {
    email: string;
    first_name: string;
    last_name: string;
  };
  status: string;
  created_at: string;
}

const Apps = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const response = await api.get('/super-admin/apps');
        if (response.data.success) {
          setApps(response.data.data.apps);
        }
      } catch (error) {
        console.error('Failed to fetch apps:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h3" mb={3}>
          Apps
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>App Name</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apps.map((app) => (
                <TableRow key={app._id}>
                  <TableCell>{app.app_name}</TableCell>
                  <TableCell>
                    {app.owner_id?.first_name} {app.owner_id?.last_name} (
                    {app.owner_id?.email})
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={app.status}
                      color={app.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(app.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
};

export default Apps;
