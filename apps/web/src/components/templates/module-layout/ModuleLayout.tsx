'use client'

interface ModuleLayoutProps {
  strip?:   React.ReactNode
  children: React.ReactNode
}

export function ModuleLayout({ strip, children }: ModuleLayoutProps) {
  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {strip && (
        <div style={{ flexShrink: 0 }}>
          {strip}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}
