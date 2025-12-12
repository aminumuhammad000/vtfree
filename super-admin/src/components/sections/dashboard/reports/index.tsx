import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ReportsChart from './ReportsChart';
import ActionMenu from 'components/common/ActionMenu';

const actions = [
  {
    id: 1,
    icon: 'mage:refresh',
    title: 'Refresh',
  },
  {
    id: 2,
    icon: 'solar:export-linear',
    title: 'Export',
  },
  {
    id: 3,
    icon: 'mage:share',
    title: 'Share',
  },
];

interface ReportsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any[];
}

const Reports = ({ data }: ReportsProps) => {
  const chartData = data?.map((item) => item.total) || [];
  const chartCategories = data?.map((item) => item._id) || [];

  return (
    <Paper sx={{ pr: 0, height: 410 }}>
      <Stack
        mt={-0.5}
        pr={3.5}
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="h6" color="text.secondary">
          Reports (Last 7 Days Revenue)
        </Typography>

        <ActionMenu actions={actions} />
      </Stack>

      <ReportsChart
        data={chartData.length > 0 ? chartData : [0, 0, 0, 0, 0, 0, 0]}
        categories={chartCategories}
        sx={{ height: '320px !important' }}
      />
    </Paper>
  );
};

export default Reports;
