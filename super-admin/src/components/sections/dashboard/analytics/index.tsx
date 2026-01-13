import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ActionMenu from 'components/common/ActionMenu';
import AnalyticsChart from './AnalyticsChart';

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

interface AnalyticsDataItem {
  _id: string;
  count: number;
}

interface AnalyticsProps {
  data?: AnalyticsDataItem[];
}

const Analytics = ({ data }: AnalyticsProps) => {
  const chartData =
    data?.map((item: AnalyticsDataItem, index: number) => ({
      id: index,
      value: item.count,
      name: item._id,
    })) || [];

  return (
    <Paper sx={{ px: 0, height: 410 }}>
      <Stack
        mt={-0.5}
        px={3.75}
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="h6" color="text.secondary" zIndex={1000}>
          Analytics
        </Typography>

        <ActionMenu actions={actions} />
      </Stack>

      <AnalyticsChart
        data={
          chartData.length > 0
            ? chartData
            : [{ id: 1, value: 0, name: 'No Data' }]
        }
        sx={{ mt: -5.5, mx: 'auto', width: 300, height: '370px !important' }}
      />
    </Paper>
  );
};

export default Analytics;
