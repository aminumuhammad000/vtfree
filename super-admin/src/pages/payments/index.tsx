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

interface Payment {
  _id: string;
  payment_reference: string;
  amount: number;
  status: string;
  user_id: {
    email: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await api.get('/super-admin/payments');
        if (response.data.success) {
          setPayments(response.data.data.payments);
        }
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h3" mb={3}>
          Payments
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>{payment.payment_reference}</TableCell>
                  <TableCell>
                    {payment.user_id?.first_name} {payment.user_id?.last_name} (
                    {payment.user_id?.email})
                  </TableCell>
                  <TableCell>₦{payment.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status}
                      color={
                        payment.status === 'success' ? 'success' : 'warning'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(payment.created_at).toLocaleString()}
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

export default Payments;
