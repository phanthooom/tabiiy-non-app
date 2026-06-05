import { useEffect, useState } from 'react'
import { authApi, cartApi } from '@/api'
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

/** Which screen to show when `status === 'error'`. */
type ErrorContext = 'telegram' | 'dev-browser' | null

export function AuthProvider({ children }: Props) {
  const [status, setStatus] = useState<Status>('loading')
  const [errorContext, setErrorContext] = useState<ErrorContext>(null)
  const { setAuth, token } = useAuthStore()
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
        // ── Mode 0: BYPASS AUTH (UI preview in browser, VITE_BYPASS_AUTH) ───
        if (import.meta.env.VITE_BYPASS_AUTH === 'true') {
          setStatus('ok')
          return
        }

        // ── Mode A: DEV JWT (local browser, VITE_DEV_ACCESS_TOKEN) ──────────
        // Skips Telegram bootstrap entirely; Telegram code below stays intact.
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

        // ── Mode B: Telegram Mini App (production + real initData) ──────────

        // Вызвать ready() / expand() как можно раньше, даже если initData ещё не готов
        const tgUi = getTelegramWebApp()
        if (tgUi) {
          tgUi.ready()
          tgUi.expand()
        }

        // Если initData уже есть — сразу авторизуемся
        // Если нет, но мы внутри Telegram — ждём до 3 секунд (SDK иногда инжектирует с задержкой)
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
          setAuth(auth.access_token, {
            id: auth.user_id,
            full_name: auth.full_name,
            username: tg.initDataUnsafe.user?.username ?? null,
            phone: null,
            language: auth.language,
          })
          setLanguage(auth.language)

          const cart = await cartApi.get()
          setCart(cart)

          setStatus('ok')
          return
        }

        // Нет initData — пробуем сохранённый токен (повторный заход, обновление страницы)
        const stored = localStorage.getItem('access_token')
        if (stored) {
          try {
            const cart = await cartApi.get()
            setCart(cart)
            setStatus('ok')
            return
          } catch {
            // Токен протух — удаляем
            localStorage.removeItem('access_token')
          }
        }

        if (token) {
          try {
            const cart = await cartApi.get()
            setCart(cart)
            setStatus('ok')
            return
          } catch {
            /* fall through */
          }
        }

        // Ничего не сработало — показываем ошибку
        setErrorContext('telegram')
        setStatus('error')
      } catch (e) {
        console.error('Auth failed:', e)
        setErrorContext(isDevJwtAuthMode() ? 'dev-browser' : 'telegram')
        const stored = localStorage.getItem('access_token')
        if (stored || token) {
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
      }}
      >
        <span style={{ fontSize: 56 }}>🍞</span>
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
      }}
      >
        <span style={{ fontSize: 56, marginBottom: 16 }}>😔</span>
        {devBrowser ? (
          <>
            <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              Local dev: API credentials needed
            </p>
            <p style={{ color: 'var(--text-2)', fontSize: 14, maxWidth: 360, lineHeight: 1.5 }}>
              Add <code style={{ fontSize: 13 }}>VITE_DEV_ACCESS_TOKEN</code>
              {' '}
              to <code style={{ fontSize: 13 }}>frontend/.env</code>
              {' '}
              (a valid JWT from your backend), then restart Vite. Alternatively log in once via
              Telegram and reuse the saved <code style={{ fontSize: 13 }}>access_token</code>
              {' '}
              in localStorage.
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
