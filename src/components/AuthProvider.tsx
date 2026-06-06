import { useEffect, useState } from 'react'
import { authApi, cartApi } from '@/api'
import { firestoreUsers } from '@/lib/firestore-service'
import { registerAuthInvalidationListener } from '@/lib/auth-invalidation'
import { isDevJwtAuthMode } from '@/lib/auth-mode'
import {
  getTelegramWebApp,
  hasTelegramInitData,
  isInsideTelegram,
  waitForTelegramInitData,
} from '@/lib/telegram'
import { useAuthStore, useCartStore, useLangStore } from '@/store'
import { Spinner } from '@/components/ui'

interface Props {
  children: React.ReactNode
}

type Status = 'loading' | 'ok' | 'error'
type ErrorContext = 'telegram' | 'dev-browser' | null

export function AuthProvider({ children }: Props) {
  const [status, setStatus] = useState<Status>('loading')
  const [errorContext, setErrorContext] = useState<ErrorContext>(null)
  const { setAuth } = useAuthStore()
  const { setCart } = useCartStore()
  const { setLanguage } = useLangStore()

  useEffect(() => {
    if (import.meta.env.VITE_BYPASS_AUTH === 'true') return
    return registerAuthInvalidationListener(() => {
      setErrorContext(isDevJwtAuthMode() ? 'dev-browser' : 'telegram')
      setStatus('error')
    })
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        // Mode 0: BYPASS AUTH
        if (import.meta.env.VITE_BYPASS_AUTH === 'true') {
          setStatus('ok')
          return
        }

        // Mode A: DEV JWT
        if (isDevJwtAuthMode()) {
          const { authenticateDevBrowser } = await import('@/lib/telegram-dev-browser-auth')
          const dev = await authenticateDevBrowser(null)
          if (!dev.ok) {
            setErrorContext('dev-browser')
            setStatus('error')
            return
          }
          setAuth(dev.token, dev.user)
          setLanguage(dev.user.language)
          setCart(dev.cart)
          setStatus('ok')
          return
        }

        // Mode B: Telegram Mini App
        const tgUi = getTelegramWebApp()
        if (tgUi) {
          tgUi.ready()
          tgUi.expand()
        }

        let hasInitData = hasTelegramInitData()
        if (!hasInitData && isInsideTelegram()) {
          hasInitData = await waitForTelegramInitData(3000)
        }

        if (hasInitData) {
          const tg = getTelegramWebApp()!
          const initData = tg.initData
          if (!initData.trim()) throw new Error('No initData')

          const auth = await authApi.telegram(initData)
          localStorage.setItem('access_token', auth.access_token)

          const userProfile = {
            id: auth.user_id,
            full_name: auth.full_name,
            username: tg.initDataUnsafe.user?.username ?? null,
            phone: null,
            language: auth.language,
          }
          setAuth(auth.access_token, userProfile)
          setLanguage(auth.language)

          // Сохраняем пользователя в Firestore (для FCM токенов)
          firestoreUsers.upsert(auth.user_id, {
            full_name: auth.full_name,
            username: tg.initDataUnsafe.user?.username ?? null,
            language: auth.language,
          }).catch(console.warn)

          // Загружаем корзину с backend
          const cart = await cartApi.get()
          setCart(cart)

          setStatus('ok')
          return
        }

        // Fallback: saved token
        const stored = localStorage.getItem('access_token')
        if (stored) {
          try {
            const cart = await cartApi.get()
            setCart(cart)
            setStatus('ok')
            return
          } catch {
            localStorage.removeItem('access_token')
          }
        }

        setErrorContext('telegram')
        setStatus('error')
      } catch (e) {
        console.error('Auth failed:', e)
        setErrorContext(isDevJwtAuthMode() ? 'dev-browser' : 'telegram')
        const token = localStorage.getItem('access_token')
        if (token) {
          try {
            const cart = await cartApi.get()
            setCart(cart)
            setStatus('ok')
          } catch {
            setStatus('error')
          }
        } else {
          setStatus('error')
        }
      }
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', gap: 20,
        background: 'var(--bg)',
      }}>
        <span style={{ fontSize: 56 }}>{'🍞'}</span>
        <Spinner size={36} />
      </div>
    )
  }

  if (status === 'error') {
    const devBrowser = errorContext === 'dev-browser'
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', padding: 24, textAlign: 'center',
        background: 'var(--bg)',
      }}>
        <span style={{ fontSize: 56, marginBottom: 16 }}>{'😔'}</span>
        {devBrowser ? (
          <>
            <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              Local dev: API credentials needed
            </p>
            <p style={{ color: 'var(--text-2)', fontSize: 14, maxWidth: 360, lineHeight: 1.5 }}>
              Add{' '}
              <code style={{ fontSize: 13 }}>VITE_DEV_ACCESS_TOKEN</code>
              {' '}to{' '}
              <code style={{ fontSize: 13 }}>frontend/.env</code>
              {' '}(a valid JWT from your backend), then restart Vite.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              Откройте через Telegram
            </p>
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
              Это приложение работает только внутри Telegram Mini App
            </p>
          </>
        )}
      </div>
    )
  }

  return <>{children}</>
}
