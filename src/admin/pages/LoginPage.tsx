import { useState } from 'react'
import { signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../shared/lib/firebase'
import { authApi } from '../api/index'
import { useAuthStore } from '../store/auth'
import { Wheat } from 'lucide-react'

// Список Gmail-ов которым разрешён вход через Google
const ALLOWED_GOOGLE_EMAILS = [
  'azamxojayevsanjar1@gmail.com',
]

type Mode = 'login' | 'reset'

export function LoginPage() {
  const [mode, setMode]       = useState<Mode>('login')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [info, setInfo]       = useState('')
  const [loading, setLoading] = useState(false)
  const setToken = useAuthStore(s => s.setToken)

  const handleEmailLogin = async () => {
    setLoading(true); setError(''); setInfo('')
    try {
      const res = await authApi.login(email, password)
      if (!res?.access_token) { setError('Некорректный ответ сервера'); return }
      setToken(res.access_token)
    } catch (e: any) {
      const detail      = e?.response?.data?.detail
      const envelopeMsg = e?.response?.data?.error?.message
      setError(
        (typeof detail === 'string' ? detail : null) ??
          envelopeMsg ?? e?.message ?? 'Неверный логин или пароль',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true); setError(''); setInfo('')
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider())
      const userEmail = result.user.email ?? ''
      if (!ALLOWED_GOOGLE_EMAILS.includes(userEmail)) {
        await auth.signOut()
        setError(`Доступ запрещён для ${userEmail}`)
        return
      }
      const token = await result.user.getIdToken()
      setToken(token)
    } catch (e: any) {
      if (e?.code !== 'auth/popup-closed-by-user') {
        setError(e?.message ?? 'Ошибка входа через Google')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!email.trim()) { setError('Введите email'); return }
    setLoading(true); setError(''); setInfo('')
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setInfo(`Письмо отправлено на ${email}`)
    } catch (e: any) {
      const msg: Record<string, string> = {
        'auth/user-not-found': 'Пользователь не найден',
        'auth/invalid-email':  'Неверный формат email',
      }
      setError(msg[e?.code] ?? e?.message ?? 'Ошибка отправки')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f9fafb', padding: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: '#ffffff', padding: '40px 32px',
        borderRadius: 20, width: '100%', maxWidth: 380,
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 60, height: 60, background: '#fef9ec', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Wheat size={30} color="#c8a96e" />
          </div>
          <h1 style={{ margin: 0, color: '#111827', fontSize: 22, fontWeight: 800 }}>Tabiiy Non</h1>
          <p style={{ margin: '6px 0 0', color: '#9ca3af', fontSize: 14 }}>
            {mode === 'login' ? 'Панель управления' : 'Сброс пароля'}
          </p>
        </div>

        {mode === 'login' ? (
          <>
            <input
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Пароль"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
              style={inputStyle}
            />

            {error && <ErrorBox msg={error} />}

            <button
              onClick={handleEmailLogin}
              disabled={loading}
              style={primaryBtn(loading)}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span style={{ color: '#9ca3af', fontSize: 12, fontWeight: 500 }}>или</span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: '#ffffff', border: '1px solid #e5e7eb',
                borderRadius: 12, color: '#374151',
                fontWeight: 600, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#c8a96e'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px #c8a96e22' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none' }}
            >
              <GoogleIcon />
              Войти через Google
            </button>

            <button
              onClick={() => { setMode('reset'); setError(''); setInfo('') }}
              style={{
                display: 'block', margin: '16px auto 0',
                background: 'none', border: 'none',
                color: '#9ca3af', fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Забыли пароль?
            </button>
          </>
        ) : (
          <>
            <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              Введите email — придёт письмо со ссылкой для смены пароля.
            </p>
            <input
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePasswordReset()}
              style={inputStyle}
            />

            {error && <ErrorBox msg={error} />}
            {info  && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <p style={{ margin: 0, color: '#16a34a', fontSize: 13 }}>{info}</p>
              </div>
            )}

            <button
              onClick={handlePasswordReset}
              disabled={loading}
              style={primaryBtn(loading)}
            >
              {loading ? 'Отправка...' : 'Отправить письмо'}
            </button>

            <button
              onClick={() => { setMode('login'); setError(''); setInfo('') }}
              style={{
                display: 'block', margin: '14px auto 0',
                background: 'none', border: 'none',
                color: '#9ca3af', fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              ← Назад
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
      <p style={{ margin: 0, color: '#dc2626', fontSize: 13 }}>{msg}</p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', marginBottom: 12,
  background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12,
  color: '#111827', fontSize: 14, boxSizing: 'border-box',
  outline: 'none', fontFamily: 'inherit',
}

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  width: '100%', padding: '13px',
  background: disabled ? '#e5e7eb' : '#c8a96e',
  border: 'none', borderRadius: 12,
  color: disabled ? '#9ca3af' : '#111827',
  fontWeight: 800, fontSize: 15,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'inherit', transition: 'background 0.15s',
})
