import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'

function tashkentHour(): number {
  return new Date(Date.now() + 5 * 60 * 60 * 1000).getUTCHours()
}

export interface WorkingHours {
  isOpen: boolean
  workStart: number
  workEnd: number
  loaded: boolean
}

export function useWorkingHours(): WorkingHours {
  const [state, setState] = useState<WorkingHours>({ isOpen: true, workStart: 8, workEnd: 22, loaded: false })

  useEffect(() => {
    getDoc(doc(db, 'settings', 'main'))
      .then(snap => {
        const data = snap.exists() ? snap.data() : {}
        const start = data.work_start_hour ?? 8
        const end = data.work_end_hour ?? 22
        const hour = tashkentHour()
        setState({ isOpen: hour >= start && hour < end, workStart: start, workEnd: end, loaded: true })
      })
      .catch(() => {
        const hour = tashkentHour()
        setState({ isOpen: hour >= 8 && hour < 22, workStart: 8, workEnd: 22, loaded: true })
      })
  }, [])

  return state
}
