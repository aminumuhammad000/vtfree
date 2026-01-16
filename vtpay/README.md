# VTPay - Virtual Top-Up & Payment Gateway

VTPay is a comprehensive fintech solution offering virtual accounts, wallet management, and payment processing capabilities. This monorepo contains the source code for the frontend, backend, and admin panel.

## 📂 Project Components

- **[vtpay-frontend](./vtpay-frontend)**: The user-facing web application (React + Vite).
- **[vtpay-server](./vtpay-server)**: The backend API server (Node.js + Express).
- **[vtpay-admin](./vtpay-admin)**: The administration dashboard.

## 🚀 Quick Start

To get the entire system running locally:

1. **Backend**:
   ```bash
   cd vtpay-server
   npm install
   npm run dev
   ```
   *Server runs on port 3000*

2. **Frontend**:
   ```bash
   cd vtpay-frontend
   npm install
   npm run dev
   ```
   *Frontend runs on port 5173*

3. **Admin Panel**:
   ```bash
   cd vtpay-admin
   npm install
   npm run dev
   ```

## 📚 Documentation

For detailed documentation, please refer to the README files in each subdirectory.

- [Frontend Documentation](./vtpay-frontend/README.md)
- [Backend Documentation](./vtpay-server/README.md)
- [Admin Documentation](./vtpay-admin/README.md)

## 🛠️ Key Features

- **Virtual Accounts**: Create and manage virtual bank accounts.
- **Wallet System**: Secure wallet for funds management.
- **Bill Payments**: Airtime, Data, and Utility bill payments.
- **Admin Dashboard**: Comprehensive tools for platform management.
