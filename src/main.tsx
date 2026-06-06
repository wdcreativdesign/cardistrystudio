import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initGA, initMixpanel } from './lib/analytics'
import './index.css'

initGA()
initMixpanel()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
