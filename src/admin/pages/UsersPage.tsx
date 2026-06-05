import { useEffect, useState } from 'react'
import { usersApi } from '../api/index'
import type { User } from '../types/index'

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const load = async () => {
    const res = await usersApi.list({ page, size: 20 })
    setUsers(res.items)
    setTotal(res.total)
  }

  useEffect(() => { load() }, [page])

  const deactivate = async (id: number) => {
    if (!confirm('Деактивировать пользователя?')) return
    await usersApi.deactivate(id)
    await load()
  }

  return (
    <div>
      <p style={{ color: '#666', marginBottom: 20, fontSize: 14 }}>Всего: {total}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(u => (
          <div key={u.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#f5f0e8', fontWeight: 600, marginBottom: 2 }}>{u.full_name}</p>
              <p style={{ color: '#666', fontSize: 13 }}>@{u.username || '—'} · {u.phone || 'нет телефона'} · {u.language.toUpperCase()}</p>
              <p style={{ color: '#444', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('ru')}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, background: u.is_active ? '#22c55e22' : '#ef444422', color: u.is_active ? '#22c55e' : '#ef4444' }}>
                {u.is_active ? 'Активен' : 'Заблокирован'}
              </span>
              {u.is_active && (
                <button onClick={() => deactivate(u.id)} style={{ padding: '4px 10px', background: '#ef444422', border: 'none', borderRadius: 6, color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>
                  Блок
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', background: '#2a2a2a', border: 'none', borderRadius: 8, color: '#aaa', cursor: 'pointer' }}>←</button>
        <span style={{ color: '#666', padding: '6px 12px' }}>{page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={users.length < 20} style={{ padding: '6px 14px', background: '#2a2a2a', border: 'none', borderRadius: 8, color: '#aaa', cursor: 'pointer' }}>→</button>
      </div>
    </div>
  )
}
