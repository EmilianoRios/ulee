import { SignIn } from '@clerk/nextjs'
import { authAppearance } from '@/lib/clerk/appearance'

export default function SignInPage() {
  return (
    <div className="auth-form-inner">
      <div className="auth-mobile-logo" aria-hidden="true">
        <span className="auth-logo auth-logo--dark">Ulee!</span>
      </div>

      <h1 className="auth-page-title">Bienvenido de vuelta</h1>
      <p className="auth-page-subtitle">
        Ingresá a tu cuenta para continuar.
      </p>

      <SignIn
        appearance={authAppearance}
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    </div>
  )
}
