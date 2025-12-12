import {
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

const notifications = [
  {
    id: 1,
    title: 'New User Registration',
    message: 'A new user has registered on the platform.',
    time: '2 hours ago',
    icon: 'mdi:account-plus',
    color: 'primary.main',
  },
  {
    id: 2,
    title: 'System Update',
    message: 'System maintenance scheduled for tonight.',
    time: '5 hours ago',
    icon: 'mdi:cog',
    color: 'warning.main',
  },
  {
    id: 3,
    title: 'Payment Received',
    message: 'Payment of ₦50,000 received from User #123.',
    time: '1 day ago',
    icon: 'mdi:cash',
    color: 'success.main',
  },
];

const Notifications = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h3" mb={3}>
          Notifications
        </Typography>
        <Paper>
          <List>
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <ListItem alignItems="flex-start">
                  <ListItemIcon>
                    <IconifyIcon
                      icon={notification.icon}
                      color={notification.color}
                      sx={{ fontSize: 28 }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {notification.message}
                        </Typography>
                        <br />
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                        >
                          {notification.time}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </div>
            ))}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Notifications;
