import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ToastContainer from './components/ToastContainer.jsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AppProvider>
          <SocketProvider>
            <App />
            <ToastContainer />
          </SocketProvider>
        </AppProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
