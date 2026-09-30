import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import L from 'leaflet'
import './index.css'
import App from './App.jsx'

// Fix leaflet icon default image lookup
delete L.Icon.Default.prototype._getIconUrl;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
