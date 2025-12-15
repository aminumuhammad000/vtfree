import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Sidebar from './sidebar';
import Topbar from './topbar';
import Footer from './footer';

const MainLayout = ({ children }: React.PropsWithChildren) => {
  const [expand, setExpand] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const drawerWidth = 240;
  const miniDrawerWidth = 90;

  return (
    <Stack direction="row" sx={{ minHeight: '100vh', bgcolor: 'rgb(248 250 252)' }}>
      <Sidebar
        expand={expand}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        drawerWidth={drawerWidth}
        miniDrawerWidth={miniDrawerWidth}
      />
      <Box component="main" flexGrow={1} sx={{ display: 'flex', flexDirection: 'column', overflowX: 'hidden', bgcolor: 'rgb(248 250 252)' }}>
        <Topbar
          expand={expand}
          mobileOpen={mobileOpen}
          setExpand={setExpand}
          setMobileOpen={setMobileOpen}
          drawerWidth={drawerWidth}
          miniDrawerWidth={miniDrawerWidth}
        />
        <Box sx={{ flexGrow: 1, mt: 12, bgcolor: 'rgb(248 250 252)' }}>{children}</Box>
        <Footer />
      </Box>
    </Stack>
  );
};

export default MainLayout;
