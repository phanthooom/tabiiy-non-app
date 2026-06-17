import React from 'react'
import { Button } from '@/app/components/ui'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        padding: '32px 24px',
        textAlign: 'center',
        gap: 16,
        background: 'var(--bg)',
      }}
      >
        <span style={{ fontSize: 56 }}>⚠️</span>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 700,
        }}
        >
          Что-то пошло не так
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14, maxWidth: 320, lineHeight: 1.5 }}>
          Произошла непредвиденная ошибка. Попробуйте снова или перезагрузите приложение.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button variant="ghost" onClick={this.handleRetry}>
            Повторить
          </Button>
          <Button onClick={this.handleReload}>
            Перезагрузить
          </Button>
        </div>
      </div>
    )
  }
}
