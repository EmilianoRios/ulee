'use client'

export function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display:         'flex',
        width:           '100vw',
        minHeight:       '100dvh',
        alignItems:      'center',
        justifyContent:  'center',
        backgroundColor: '#0f1117',
        padding:         '32px 0',
        boxSizing:       'border-box',
      }}
    >
      <div
        style={{
          width:     '100%',
          maxWidth:  480,
          padding:   '0 24px',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  )
}
