import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-root">
      <aside className="auth-brand-panel" aria-hidden="true">
        <div className="auth-brand-center">
          <span className="auth-logo">Ulee!</span>
          <p className="auth-tagline">Tu complejo,{'\n'}en orden.</p>
        </div>
        <span className="auth-brand-bottom">© 2026 Ulee!</span>
      </aside>

      <main className="auth-form-panel">
        {children}
      </main>
    </div>
  )
}
