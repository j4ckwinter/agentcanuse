import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { startAnalytics } from './analytics'
import { App } from './app'
import './index.css'

const root = document.getElementById('root')
if (root === null) throw new Error('index.html has no #root element')

startAnalytics()
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
