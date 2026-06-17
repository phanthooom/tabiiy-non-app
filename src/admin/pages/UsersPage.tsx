import { useEffect, useState, useCallback } from 'react'
import { usersApi } from '../api/index'
import type { User } from '../types/index'
import { Users } from 'lucide-react'

const PAGE_SIZE = 50

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage]   = useState(1)

  const load = useCallback(async () => {
    const res = await usersApi.list({ page, size: PAGE_SIZE })
    setUsers(res.items)
    setTotal(res.total)
  }, [page])

  useEffect(() => { load() }, [load])

  const deactivate = async (id: number) => {
    if (!confirm('Деактивировать пользователя?')) return
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: false } : u))
    await usersApi.deactivate(id)
  }

  return (
    <div>
      {/* Stats card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: '16px 20px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Пользователей
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 30, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {total}
          </p>
        </div>
        <div style={{
          width: 48, height: 48,
          background: '#eff6ff',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={22} color="#3b82f6" />
        </div>
      </div>

      {/* User list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(u => (
          <div
            key={u.id}
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{
                width: 40, height: 40,
                background: '#f3f4f6',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16, color: '#6b7280', flexShrink: 0,
              }}>
                {(u.full_name?.[0] || u.username?.[0] || '?').toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#111827' }}>
                  {u.full_name}
                </p>
                <p style={{ margin: '2px 0 0', color: '#9ca3af', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  @{u.username || '—'} · {u.phone || 'нет телефона'} · {u.language.toUpperCase()}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: u.is_active ? '#dcfce7' : '#fee2e2',
                color: u.is_active ? '#16a34a' : '#dc2626',
              }}>
                {u.is_active ? 'Активен' : 'Заблокирован'}
              </span>
              {u.is_active && (
                <button
                  onClick={() => deactivate(u.id)}
                  style={{
                    padding: '5px 12px',
                    background: '#ffffff',
                    border: '1px solid #fca5a5',
                    borderRadius: 8,
                    color: '#dc2626', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Блок
                </button>
              )}
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: 15 }}>Нет пользователей</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          style={pgBtn(page === 1)}
        >
          ←
        </button>
        <span style={{ padding: '8px 14px', color: '#6b7280', fontWeight: 600, fontSize: 14 }}>
          {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={users.length < PAGE_SIZE}
          style={pgBtn(users.length < PAGE_SIZE)}
        >
          →
        </button>
      </div>
    </div>
  )
}

const pgBtn = (disabled: boolean): React.CSSProperties => ({
  padding: '8px 18px',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  color: disabled ? '#9ca3af' : '#111827',
  fontWeight: 600, fontSize: 14,
  cursor: disabled ? 'default' : 'pointer',
  fontFamily: 'inherit',
})
