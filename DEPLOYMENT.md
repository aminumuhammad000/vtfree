# VTfree VPS Deployment Guide

This guide will help you deploy the entire VTfree ecosystem on a Linux VPS (Ubuntu 22.04+ recommended).

## 1. Prerequisites
Install the necessary system dependencies:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
sudo apt-get install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Redis (Required for Build Worker)
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

## 2. Backend Deployment
cd /var/www/vtfree/backend
npm install
# Update .env with production credentials (JWT_SECRET, MONGO_URI, etc.)
npm run build
pm2 start dist/server.js --name "vtfree-api"

### Create Super Admin
```bash
cd backend
npm run create:super-admin
```
*   **Default Email**: `superadmin@vtfree.com`
*   **Default Password**: `Admin@123456`

### Create App & Owner
Use this script to create a business owner and their first VTU application.
```bash
cd backend
npm run setup:app -- --email=owner@example.com --password=Admin@123456 --name="My VTU App" --id=app_001
```
*   `--email`: The email of the app owner.
*   `--password`: The password for both owner dashboard and app admin.
*   `--name`: The display name of the VTU application.
*   `--id`: A unique ID for the application (e.g., `app_001`).

## 4. Frontend Deployments

### Landing Page
Static files, no build needed. Move to `/var/www/vtfree/landing`.

### App Template (User Dashboards)
```bash
cd /var/www/vtfree/app-templete
npm install
npx expo export --platform web
# Build output is in 'dist'
```

### App Admin (Vendor Dashboards)
```bash
cd /var/www/vtfree/app-admin
npm install
npm run build
# Build output is in 'dist'
```

### Super Admin
```bash
cd /var/www/vtfree/super-admin
npm install
npm run build
# Build output is in 'dist'
```

## 4. Nginx Configuration
Create `/etc/nginx/sites-available/vtfree`:

```nginx
# See vtfree.nginx.conf for full configuration
```

Then enable it:
```bash
sudo ln -s /etc/nginx/sites-available/vtfree /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. SSL with Certbot
```bash
sudo apt install snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d vtfree.com.ng -d app.vtfree.com.ng -d vendor.vtfree.com.ng -d admin.vtfree.com.ng -d api.vtfree.com.ng
```

## 6. Maintenance
To view logs: `pm2 logs vtfree-api`
To restart: `pm2 restart vtfree-api`
