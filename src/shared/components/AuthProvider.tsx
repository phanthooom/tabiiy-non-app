import { useEffect, useState } from 'react'
import { cartApi } from '@/app/api'
import { setCurrentUser } from '@/app/api/firestore-api'
import { firestoreUsers } from '@/shared/lib/firestore-service'
import { registerAuthInvalidationListener } from '@/shared/lib/auth-invalidation'
import { isDevJwtAuthMode } from '@/shared/lib/auth-mode'
import {
  getTelegramWebApp,
  hasTelegramInitData,
  isInsideTelegram,
  waitForTelegramInitData,
} from '@/shared/lib/telegram'
import { useAuthStore, useCartStore, useLangStore } from '@/app/store'
import { Spinner } from '@/app/components/ui'
import { Croissant } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

type Status = 'loading' | 'ok' | 'error'
type ErrorContext = 'telegram' | 'dev-browser' | null

export function AuthProvider({ children }: Props) {
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')

  const [status, setStatus] = useState<Status>(isAdminRoute ? 'ok' : 'loading')
  const [errorContext, setErrorContext] = useState<ErrorContext>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')
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
      if (isAdminRoute) return
      try {
        // Mode 0: BYPASS AUTH (Only if not opened inside Telegram)
        if (import.meta.env.VITE_BYPASS_AUTH === 'true' && !hasTelegramInitData()) {
          setCurrentUser(1) // Mock user ID for bypass mode
          setAuth('fake_token', { id: 1, full_name: 'Demo User', username: 'demo', phone: null, language: 'ru' })
          try {
            const cart = await cartApi.get()
            setCart(cart)
          } catch {
            setCart({ items: [], total: 0, items_count: 0 })
          }
          setStatus('ok')
          return
        }

        // Mode A: DEV JWT
        if (isDevJwtAuthMode()) {
          const { authenticateDevBrowser } = await import('@/shared/lib/telegram-dev-browser-auth')
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
          const user = tg.initDataUnsafe.user
          if (!user?.id) throw new Error('No user data from Telegram')

          const userId = user.id
          setCurrentUser(userId)
          
          // Fallback token for auth store compatibility
          const fakeToken = `tg_${userId}`
          localStorage.setItem('access_token', fakeToken)

          const firestoreUser = await firestoreUsers.get(userId)

          const userProfile = {
            id: userId,
            full_name: firestoreUser?.full_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'User',
            username: firestoreUser?.username || (user.username ?? null),
            phone: firestoreUser?.phone || null,
            language: firestoreUser?.language || 'uz' as 'uz' | 'ru',
          }
          setAuth(fakeToken, userProfile as any)
          setLanguage(userProfile.language)

          firestoreUsers.upsert(userId, {
            full_name: userProfile.full_name,
            username: userProfile.username,
            language: userProfile.language,
          }).catch(console.warn)

          const cart = await cartApi.get()
          setCart(cart)

          setStatus('ok')
          return
        }

        // Fallback: in Dev or Web without initData but with stored ID
        const stored = localStorage.getItem('access_token')
        if (stored && stored.startsWith('tg_')) {
          try {
            const userId = parseInt(stored.replace('tg_', ''), 10)
            setCurrentUser(userId)
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
      } catch (e: any) {
        console.error('Auth failed:', e)
        setErrorMsg(e?.message || String(e))
        setErrorContext(isDevJwtAuthMode() ? 'dev-browser' : 'telegram')
        const stored = localStorage.getItem('access_token')
        if (stored && stored.startsWith('tg_')) {
          try {
            const userId = parseInt(stored.replace('tg_', ''), 10)
            setCurrentUser(userId)
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
        <Croissant size={48} color="#0f172a" strokeWidth={1.5} />
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
            {errorMsg && (
              <p style={{ color: 'red', fontSize: 12, marginTop: 16, maxWidth: 300, wordBreak: 'break-all' }}>
                Error: {errorMsg}
              </p>
            )}
          </>
        )}
      </div>
    )
  }

  return <>{children}</>
}
