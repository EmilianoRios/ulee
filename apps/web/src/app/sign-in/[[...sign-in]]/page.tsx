import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div
      style={{
        display:        'flex',
        minHeight:      '100vh',
        width:          '100vw',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        24,
      }}
    >
      <SignIn />
    </div>
  )
}
