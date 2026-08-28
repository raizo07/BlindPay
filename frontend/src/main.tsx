import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BlindPayWalletProvider } from './hooks/WalletProvider.tsx'
import { validateEnv } from './config/env.ts'

const envCheck = validateEnv()
if (!envCheck.ok) {
  console.error('[BlindPay] Configuration errors:', envCheck.errors)
}
if (envCheck.warnings.length) {
  console.warn('[BlindPay] Configuration warnings:', envCheck.warnings)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BlindPayWalletProvider>
      {envCheck.ok ? (
        <App />
      ) : (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-xl font-bold">Configuration required</h1>
            <ul className="text-sm text-red-300 space-y-1">
              {envCheck.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <p className="text-gray-400 text-sm">Copy frontend/.env.example to frontend/.env and set required variables.</p>
          </div>
        </div>
      )}
    </BlindPayWalletProvider>
  </StrictMode>,
)
