'use client'

export function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display:         'flex',
        width:           '100vw',
        height:          '100vh',
        alignItems:      'center',
        justifyContent:  'center',
        backgroundColor: '#0f1117',
        overflow:        'auto',
      }}
    >
      <div
        style={{
          width:     '100%',
          maxWidth:  480,
          padding:   '32px 24px',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  )
}
