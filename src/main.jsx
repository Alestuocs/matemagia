import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// GitHub Pages serves at /matemagia/, Capacitor WebView serves at /.
// Vite injects BASE_URL ("/matemagia/" or "./" depending on BUILD_TARGET).
// React Router needs a clean leading-slash path or "/".
const rawBase = import.meta.env.BASE_URL || '/'
const basename = rawBase.startsWith('/') ? rawBase.replace(/\/$/, '') || '/' : '/'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
