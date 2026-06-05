export function TopAppBar() {
  const safeTop = 'var(--tg-safe-area-inset-top, env(safe-area-inset-top, 0px))'
  return (
    <header
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: `calc(var(--top-bar-height) + ${safeTop})`,
        paddingTop: safeTop,
        background: 'linear-gradient(180deg, #dce8eb 0%, #f1f8f8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <span
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#0f172a',
          letterSpacing: '-0.02em',
          fontFamily: 'var(--font-display)',
        }}
      >
        Tabiiy Non
      </span>
    </header>
  )
}
