import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Global styles
import './styles/index.css'
// Component styles
import './styles/sidebar.css'
// Layout styles
import './styles/dashboard.css'
// Page styles
import './styles/auth.css'
import './styles/overview.css'
import './styles/wallet.css'
import './styles/virtual-accounts.css'
import './styles/transactions.css'
import './styles/developer.css'
import './styles/api-docs.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
