import type { TelegramUser, TelegramWebApp } from '@/shared/types'

/** Mock user for local browser development only (no Telegram client). */
export const DEV_BROWSER_MOCK_USER: TelegramUser = {
  id: 100_000_001,
  first_name: 'Dev',
  last_name: 'Browser',
  username: 'dev_browser',
  language_code: 'ru',
}

const noop = (): void => {}

function createMainButton(): TelegramWebApp['MainButton'] {
  const clicks = new Set<() => void>()
  const btn: TelegramWebApp['MainButton'] = {
    text: '',
    color: '#3390ec',
    textColor: '#ffffff',
    isVisible: false,
    isActive: true,
    show: noop,
    hide: noop,
    enable: noop,
    disable: noop,
    showProgress: noop,
    hideProgress: noop,
    onClick: (fn: () => void) => {
      clicks.add(fn)
    },
    offClick: (fn: () => void) => {
      clicks.delete(fn)
    },
    setText(text: string) {
      btn.text = text
    },
  }
  return btn
}

function createBackButton(): TelegramWebApp['BackButton'] {
  const clicks = new Set<() => void>()
  return {
    isVisible: false,
    show: noop,
    hide: noop,
    onClick: (fn: () => void) => {
      clicks.add(fn)
    },
    offClick: (fn: () => void) => {
      clicks.delete(fn)
    },
  }
}

let devMockInstance: TelegramWebApp | null = null

/**
 * Telegram WebApp stub used only when `import.meta.env.DEV` and there is no real `initData`.
 * Marked for typing / debugging; never enable in production builds.
 */
export interface DevMockTelegramWebApp extends TelegramWebApp {
  readonly __DEV_BROWSER_MOCK__: true
}

function buildDevMockTelegramWebApp(): DevMockTelegramWebApp {
  const authDate = Math.floor(Date.now() / 1000)
  const webApp: DevMockTelegramWebApp = {
    __DEV_BROWSER_MOCK__: true,
    initData: '',
    initDataUnsafe: {
      user: DEV_BROWSER_MOCK_USER,
      auth_date: authDate,
      hash: 'dev-browser-mock',
    },
    colorScheme: 'light',
    themeParams: {
      bg_color: '#faf8f4',
      text_color: '#1a1a1a',
      hint_color: '#8e8e8e',
      link_color: '#3390ec',
      button_color: '#3390ec',
      button_text_color: '#ffffff',
    },
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
    viewportStableHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
    isExpanded: true,
    expand: noop,
    close: noop,
    ready: noop,
    MainButton: createMainButton(),
    BackButton: createBackButton(),
    HapticFeedback: {
      impactOccurred: noop,
      notificationOccurred: noop,
      selectionChanged: noop,
    },
    showAlert(message: string, callback?: () => void): void {
      window.alert(`[DEV WebApp] ${message}`)
      callback?.()
    },
    showConfirm(message: string, callback: (ok: boolean) => void): void {
      callback(window.confirm(`[DEV WebApp] ${message}`))
    },
  }
  return webApp
}

/** Returns true when running inside Telegram Mini App with signed init data. */
export function hasTelegramInitData(): boolean {
  const raw = window.Telegram?.WebApp?.initData
  return typeof raw === 'string' && raw.trim().length > 0
}

/**
 * Returns true when the Telegram WebApp object is present on the page —
 * i.e. the SDK script loaded and we are inside some Telegram context
 * (Mini App, Telegram browser, WebK, etc.).
 * Note: this does NOT mean initData is valid — use hasTelegramInitData() for that.
 */
export function isInsideTelegram(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp
}

/**
 * Waits up to `timeoutMs` for `window.Telegram.WebApp.initData` to become non-empty.
 * Useful when the SDK injects initData slightly after DOMContentLoaded.
 * Resolves with true if initData appeared, false if timed out.
 */
export function waitForTelegramInitData(timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    if (hasTelegramInitData()) {
      resolve(true)
      return
    }
    const start = Date.now()
    const interval = setInterval(() => {
      if (hasTelegramInitData()) {
        clearInterval(interval)
        resolve(true)
      } else if (Date.now() - start >= timeoutMs) {
        clearInterval(interval)
        resolve(false)
      }
    }, 50)
  })
}

/**
 * Single accessor for Telegram WebApp UI APIs.
 * - Real Mini App: returns `window.Telegram.WebApp` (validated via non-empty `initData`).
 * - `vite` dev in a normal browser: returns a typed mock (no real `initData`).
 * - Production build outside Telegram: returns SDK object if present, otherwise `null`.
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (hasTelegramInitData()) {
    return window.Telegram!.WebApp
  }
  if (import.meta.env.DEV) {
    if (!devMockInstance) {
      devMockInstance = buildDevMockTelegramWebApp()
    }
    return devMockInstance
  }
  return window.Telegram?.WebApp ?? null
}
