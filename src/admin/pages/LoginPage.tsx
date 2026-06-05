import { useState } from 'react'
import { authApi } from '../api/index'
import { useAuthStore } from '../store/auth'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
      const detail = e?.response?.data?.detail
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ background: '#1e293b', padding: 40, borderRadius: 16, width: 360, maxWidth: '90vw', border: '1px solid #334155' }}>
        <h1 style={{ color: '#f1f5f9', fontSize: 22, marginBottom: 8, fontWeight: 700 }}>🍞 Tabiiy Non</h1>
        <p style={{ color: '#64748b', marginBottom: 28, fontSize: 14 }}>Панель управления</p>
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
        {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button onClick={submit} disabled={loading} style={btnStyle}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', marginBottom: 12,
  background: '#0f172a', border: '1px solid #334155', borderRadius: 10,
  color: '#fff', fontSize: 14, boxSizing: 'border-box',
}
const btnStyle: React.CSSProperties = {
  width: '100%', padding: '12px', background: '#38bdf8',
  border: 'none', borderRadius: 10, color: '#0f172a',
  fontWeight: 700, fontSize: 15, cursor: 'pointer',
}
