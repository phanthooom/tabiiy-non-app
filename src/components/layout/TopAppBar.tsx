export function TopAppBar() {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 'var(--top-bar-height)',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <span
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--primary)',
          letterSpacing: '-0.02em',
          fontFamily: 'var(--font-display)',
        }}
      >
        Tabiiy Non
      </span>
    </header>
  )
}
