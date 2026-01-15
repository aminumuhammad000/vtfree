import paths from 'routes/paths';

export interface SubMenuItem {
  name: string;
  pathName: string;
  path: string;
  active?: boolean;
  items?: SubMenuItem[];
}

export interface MenuItem {
  id: string | number;
  subheader?: string;
  path?: string;
  name?: string;
  icon?: string;
  active?: boolean;
  items?: SubMenuItem[];
  messages?: number;
}

const sitemap: MenuItem[] = [
  {
    id: 'dashboard',
    subheader: 'Dashboard',
    path: paths.dashboard,
    icon: 'solar:widget-bold',
  },
  {
    id: 'payment',
    name: 'Payment',
    path: paths.payments,
    icon: 'solar:card-bold',
  },
  {
    id: 'transactions',
    name: 'Transactions',
    path: paths.transactions,
    icon: 'solar:bill-list-bold',
  },
  {
    id: 'apps',
    name: 'Apps',
    path: paths.apps,
    icon: 'solar:smartphone-bold',
  },
  {
    id: 'users',
    name: 'Users',
    path: paths.users,
    icon: 'solar:users-group-rounded-bold',
  },
  {
    id: 'settings',
    name: 'Settings',
    path: paths.settings,
    icon: 'solar:settings-bold',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    path: paths.notifications,
    icon: 'solar:bell-bing-bold',
  },
];

export default sitemap;
