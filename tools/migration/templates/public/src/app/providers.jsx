'use client'
import { LanguageProvider } from '../i18n/LanguageContext.jsx'
import { AuthProvider } from '../shared/auth/AuthContext.jsx'

export default function Providers({ children }) {
  return (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  )
}
