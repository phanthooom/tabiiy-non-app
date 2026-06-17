import { useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDeliveryStore } from '@/app/store'
import { AddressMapModal } from '@/app/components/ui/AddressMapModal'

export function DeliveryLocationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setDeliveryType, setAddress, addAddress } = useDeliveryStore()
  const confirmed = useRef(false)
  const returnToProfile = location.state?.returnToProfile

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
          if (addr) {
            setAddress(addr)
            if (returnToProfile && addAddress) {
              addAddress({
                type: 'other',
                title: addr.split(',')[0].slice(0, 20) || 'Yangi manzil',
                address: addr,
                details: ''
              })
              navigate('/profile/addresses', { replace: true })
            } else {
              navigate('/', { replace: true })
            }
          } else {
            navigate(-1)
          }
        }}
        apiKey="fcd5b77b-d255-480e-b530-ec10724a2275"
      />
    </div>
  )
}
