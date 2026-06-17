import { useState } from 'react'
import { authApi } from '../api/index'
import { useAuthStore } from '../store/auth'
import { Wheat } from 'lucide-react'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const setToken = useAuthStore(s => s.setToken)

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(username, password)
      if (!res?.access_token) {
        setError('Некорректный ответ сервера')
        return
      }
      setToken(res.access_token)
    } catch (e: any) {
      const detail      = e?.response?.data?.detail
      const envelopeMsg = e?.response?.data?.error?.message
      setError(
        (typeof detail === 'string' ? detail : null) ??
          envelopeMsg ??
          e?.message ??
          'Неверный логин или пароль',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
      padding: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: '#ffffff',
        padding: '40px 32px',
        borderRadius: 20,
        width: '100%',
        maxWidth: 380,
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, background: '#fef9ec', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Wheat size={30} color="#c8a96e" />
          </div>
          <h1 style={{ margin: 0, color: '#111827', fontSize: 22, fontWeight: 800 }}>Tabiiy Non</h1>
          <p style={{ margin: '6px 0 0', color: '#9ca3af', fontSize: 14 }}>Панель управления</p>
        </div>

        <input
          placeholder="Логин"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Пароль"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={inputStyle}
        />

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
          }}>
            <p style={{ margin: 0, color: '#dc2626', fontSize: 13 }}>{error}</p>
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: '100%', padding: '13px',
            background: loading ? '#e5e7eb' : '#c8a96e',
            border: 'none', borderRadius: 12,
            color: loading ? '#9ca3af' : '#111827',
            fontWeight: 800, fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', marginBottom: 12,
  background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12,
  color: '#111827', fontSize: 14, boxSizing: 'border-box',
  outline: 'none', fontFamily: 'inherit',
}
