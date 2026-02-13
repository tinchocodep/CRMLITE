import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Suppress Supabase internal AbortErrors from appearing in console
// These are intentional cancellations from Supabase's auth state management
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError' || event.reason?.message?.includes('AbortError')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
