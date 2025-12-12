import Stack from '@mui/material/Stack';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Rating from '@mui/material/Rating';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import IconifyIcon from 'components/base/IconifyIcon';
// import { TopProduct } from 'data/topProductsData';

interface ProductCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

const ProductCard = ({ data }: ProductCardProps) => {
  return (
    <Card>
      <Stack alignItems="center" justifyContent="space-between">
        <Stack spacing={2} alignItems="center" minWidth={190}>
          <CardMedia
            component="img"
            src={data.logo || 'https://via.placeholder.com/100'}
            sx={{ height: 100, width: 100, borderRadius: '50%' }}
            alt="app_logo"
          />
          <div>
            <Typography
              component={Link}
              href={`/apps/${data._id}`}
              variant="body1"
              color="text.primary"
              fontWeight={500}
              display="block"
              mb={0.75}
            >
              {data.app_name}
            </Typography>
            <Rating
              name="half-rating-read"
              size="small"
              defaultValue={5}
              icon={<IconifyIcon icon="iconamoon:star-fill" />}
              emptyIcon={<IconifyIcon icon="iconamoon:star-fill" />}
              precision={1}
              readOnly
            />
            <Typography
              variant="body2"
              color="text.secondary"
              display="block"
              mt={0.5}
            >
              Owner: {data.owner_id?.first_name} {data.owner_id?.last_name}
            </Typography>
          </div>
        </Stack>
      </Stack>
    </Card>
  );
};

export default ProductCard;
