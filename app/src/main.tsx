import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PomodoroProvider } from './contexts/PomodoroContext'
import { AppLayout } from './layouts/AppLayout'
import App from './App.tsx'
import { DailyLogPage } from './pages/DailyLogPage.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <PomodoroProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/log" element={<DailyLogPage />} />
          </Routes>
        </AppLayout>
      </PomodoroProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
