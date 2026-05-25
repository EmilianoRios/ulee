import { SignUp } from '@clerk/nextjs'
import { authAppearance } from '@/lib/clerk/appearance'

export default function SignUpPage() {
  return (
    <div className="auth-form-inner">
      <div className="auth-mobile-logo" aria-hidden="true">
        <span className="auth-logo auth-logo--dark">Ulee!</span>
      </div>

      <h1 className="auth-page-title">Creá tu cuenta</h1>
      <p className="auth-page-subtitle">
        Empezá a gestionar tu complejo hoy.
      </p>

      <SignUp
        appearance={authAppearance}
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
      />
    </div>
  )
}
