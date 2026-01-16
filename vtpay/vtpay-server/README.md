# VTPay Server

The backend server for the VTPay platform, handling payments, virtual accounts, and wallet management. Built with Node.js, Express, and MongoDB.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (Local or Atlas URI)

### Installation

1. Navigate to the server directory:
   ```bash
   cd vtpay-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Environment Setup:
   Create a `.env` file in the root directory with the following variables:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/vtpay
   JWT_SECRET=your_jwt_secret
   # Add other required variables (Zainpay API keys, etc.)
   ```

### Running the Server

To start the development server with hot-reload:

```bash
npm run dev
```

To build and start for production:

```bash
npm run build
npm start
```

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (with Mongoose)
- **Language:** TypeScript
- **Authentication:** JWT & Bcrypt
- **External APIs:** Zainpay Integration

## 🔌 API Endpoints

The server exposes RESTful endpoints for:
- Authentication (`/api/auth`)
- Wallet Management (`/api/wallet`)
- Virtual Accounts (`/api/virtual-accounts`)
- Transactions (`/api/transactions`)
- Webhooks (`/api/webhooks`)

## 📂 Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── middleware/     # Express middleware (Auth, Error handling)
├── models/         # Mongoose models
├── routes/         # API route definitions
├── services/       # Business logic and external services
├── utils/          # Utility functions
└── server.ts       # Entry point
```
