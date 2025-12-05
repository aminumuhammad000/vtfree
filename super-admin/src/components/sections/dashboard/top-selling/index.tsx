// import { topProductsData } from 'data/topProductsData';
import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ActionMenu from 'components/common/ActionMenu';
import ProductCard from './ProductCard';

const actions = [
  {
    id: 1,
    icon: 'mage:refresh',
    title: 'Refresh',
  },
  {
    id: 2,
    icon: 'mage:eye',
    title: 'View All',
  },
  {
    id: 3,
    icon: 'mage:share',
    title: 'Share',
  },
];

interface TopSellingProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any[];
}

const TopSelling = ({ data }: TopSellingProps) => {
  return (
    <Paper sx={{ height: 370 }}>
      <Stack mt={-0.5} alignItems="center" justifyContent="space-between">
        <Typography variant="h6" color="text.secondary">
          Top Apps
        </Typography>

        <ActionMenu actions={actions} />
      </Stack>

      <Box mt={3}>
        {data?.slice(0, 2).map((item, index) => (
          <React.Fragment key={item._id}>
            <ProductCard data={item} />
            {index !== 1 && <Divider />}
          </React.Fragment>
        ))}
      </Box>
    </Paper>
  );
};

export default TopSelling;
