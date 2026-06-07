import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeliveryStore } from '@/store'
import { AddressMapModal } from '@/components/ui/AddressMapModal'

export function DeliveryLocationPage() {
  const navigate = useNavigate()
  const { setDeliveryType, setAddress } = useDeliveryStore()
  const confirmed = useRef(false)

  return (
    <div style={{ height: '100dvh', background: '#f8fafc' }}>
      <AddressMapModal
        isOpen={true}
        onClose={() => {
          if (!confirmed.current) {
            navigate('/welcome', { replace: true })
          }
        }}
        onConfirm={(addr) => {
          confirmed.current = true
          setDeliveryType('delivery')
          if (addr) setAddress(addr)
          navigate('/', { replace: true })
        }}
        apiKey="fcd5b77b-d255-480e-b530-ec10724a2275"
      />
    </div>
  )
}
