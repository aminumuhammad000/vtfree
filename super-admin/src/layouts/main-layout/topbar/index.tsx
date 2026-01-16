import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import IconifyIcon from 'components/base/IconifyIcon';
import ProfileMenu from './ProfileMenu';

interface TopbarProps {
  expand: boolean;
  mobileOpen: boolean;
  setExpand: React.Dispatch<React.SetStateAction<boolean>>;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  drawerWidth: number;
  miniDrawerWidth: number;
}

const Topbar = ({
  expand,
  mobileOpen,
  setMobileOpen,
  drawerWidth,
  miniDrawerWidth,
}: TopbarProps) => {
  const handleMobileOpen = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        right: 0,
        width: {
          xs: 1,
          lg: expand
            ? `calc(100% - ${drawerWidth}px)`
            : `calc(100% - ${miniDrawerWidth}px)`,
        },
        zIndex: 40, // Below sidebar which is z-50
      }}
    >
      <Stack px={3} py={2} alignItems="center" justifyContent="flex-end">
        <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
          {/* Mobile menu button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleMobileOpen}
            edge="start"
            sx={{ display: { xs: 'flex', lg: 'none' } }}
          >
            <IconifyIcon icon="solar:hamburger-menu-outline" />
          </IconButton>

          <IconButton>
            <Badge
              color="error"
              badgeContent={2}
              sx={{ '& .MuiBadge-badge': { top: 6, right: 2 } }}
            >
              <IconifyIcon icon="mdi:bell-outline" />
            </Badge>
          </IconButton>
          <ProfileMenu />
        </Stack>
      </Stack>
    </AppBar>
  );
};

export default Topbar;
