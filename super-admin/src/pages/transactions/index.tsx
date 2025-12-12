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

interface Transaction {
  _id: string;
  reference: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.get('/super-admin/transactions');
        if (response.data.success) {
          setTransactions(response.data.data.transactions);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h3" mb={3}>
          Transactions
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx._id}>
                  <TableCell>{tx.reference}</TableCell>
                  <TableCell>{tx.type}</TableCell>
                  <TableCell>₦{tx.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={tx.status}
                      color={
                        tx.status === 'success'
                          ? 'success'
                          : tx.status === 'pending'
                            ? 'warning'
                            : 'error'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(tx.created_at).toLocaleString()}
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

export default Transactions;
