import { useEffect } from 'react'
import type { TelegramUser, TelegramWebApp } from '@/shared/types'
import { getTelegramWebApp } from '@/shared/lib/telegram'

export function useTelegram(): {
  tg: TelegramWebApp | null
  user: TelegramUser | undefined
} {
  const tg = getTelegramWebApp()
  return { tg, user: tg?.initDataUnsafe?.user }
}

export function useTelegramSetup() {
  const { tg } = useTelegram()
  useEffect(() => {
    if (!tg) return
    tg.ready()
    tg.expand()
  }, [tg])
  return tg
}

export function useBackButton(onBack: () => void, enabled = true) {
  const { tg } = useTelegram()
  useEffect(() => {
    if (!tg) return
    if (enabled) {
      tg.BackButton.show()
      tg.BackButton.onClick(onBack)
    } else {
      tg.BackButton.hide()
    }
    return () => {
      tg.BackButton.offClick(onBack)
      tg.BackButton.hide()
    }
  }, [tg, onBack, enabled])
}

export function useMainButton(
  text: string,
  onClick: () => void,
  options: { active?: boolean; visible?: boolean } = {}
) {
  const { tg } = useTelegram()
  const { active = true, visible = true } = options

  useEffect(() => {
    if (!tg) return
    tg.MainButton.setText(text)
    visible ? tg.MainButton.show() : tg.MainButton.hide()
    active ? tg.MainButton.enable() : tg.MainButton.disable()
    tg.MainButton.onClick(onClick)
    return () => {
      tg.MainButton.offClick(onClick)
      tg.MainButton.hide()
    }
  }, [tg, text, onClick, active, visible])
}
