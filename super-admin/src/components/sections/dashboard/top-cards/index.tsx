import Grid from '@mui/material/Grid';
import TopCard from './TopCard';

import { TopCard as TopCardType } from 'data/topCardsData';

interface TopCardsProps {
  data?: TopCardType[];
}

const TopCards = ({ data }: TopCardsProps) => {
  const displayData = data || [];

  return (
    <Grid container spacing={3.75}>
      {displayData.map((item) => (
        <Grid item key={item.id} xs={12} sm={6} lg={3}>
          <TopCard data={item} />
        </Grid>
      ))}
    </Grid>
  );
};

export default TopCards;
