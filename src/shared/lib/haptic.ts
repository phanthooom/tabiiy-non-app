import { getTelegramWebApp } from '@/shared/lib/telegram'

type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
type NotifyType = 'error' | 'success' | 'warning'

/** Лёгкий тактильный отклик при нажатии (тап по кнопке/ссылке). */
export function hapticTap(style: ImpactStyle = 'light'): void {
  try {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred(style)
  } catch {}
}

/** Отклик результата операции (успех/ошибка/предупреждение). */
export function hapticNotify(type: NotifyType): void {
  try {
    getTelegramWebApp()?.HapticFeedback?.notificationOccurred(type)
  } catch {}
}

/** Тонкий «тик» при смене выбора (переключатели, табы). */
export function hapticSelection(): void {
  try {
    getTelegramWebApp()?.HapticFeedback?.selectionChanged()
  } catch {}
}

/**
 * Вешает один делегированный listener на document: любой тап по
 * интерактивному элементу (button, a, [role=button], cursor:pointer)
 * даёт лёгкий вибро-отклик. Возвращает функцию отписки.
 */
export function installGlobalHaptics(): () => void {
  if (typeof document === 'undefined') return () => {}

  const isInteractive = (start: EventTarget | null): boolean => {
    let el = start as HTMLElement | null
    let depth = 0
    while (el && depth < 6) {
      if (el.dataset?.noHaptic !== undefined) return false
      const tag = el.tagName
      if (tag === 'BUTTON' || tag === 'A' || tag === 'SELECT') return true
      if (tag === 'INPUT') {
        const type = (el as HTMLInputElement).type
        if (type === 'checkbox' || type === 'radio' || type === 'button' || type === 'submit') return true
      }
      const role = el.getAttribute?.('role')
      if (role === 'button' || role === 'tab' || role === 'switch') return true
      if (el.dataset?.haptic !== undefined) return true
      try {
        if (getComputedStyle(el).cursor === 'pointer') return true
      } catch {}
      el = el.parentElement
      depth++
    }
    return false
  }

  const handler = (e: Event) => {
    if (isInteractive(e.target)) hapticTap('light')
  }

  document.addEventListener('pointerdown', handler, { passive: true, capture: true })
  return () => document.removeEventListener('pointerdown', handler, { capture: true } as any)
}
