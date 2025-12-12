import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/components/sidebar.css'
import './styles/layouts/dashboard.css'
import './styles/pages/overview.css'
import './styles/pages/wallet.css'
import './styles/pages/virtual-accounts.css'
import './styles/pages/transactions.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
