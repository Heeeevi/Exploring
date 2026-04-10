import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { I18nProvider } from './i18n.jsx'
import { applyTheme } from './useTheme.js'

const savedTheme = localStorage.getItem('theme')
applyTheme(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark')

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <I18nProvider>
            <App />
        </I18nProvider>
    </React.StrictMode>
)
