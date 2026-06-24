import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'

import { AuthProvider } from '@/shared/components/AuthProvider'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { BottomNav } from '@/app/components/layout/BottomNav'
import { TopAppBar } from '@/app/components/layout/TopAppBar'
import { SplashScreen } from '@/shared/components/SplashScreen'
import { queryClient } from '@/shared/lib/query-client'
import { installGlobalHaptics } from '@/shared/lib/haptic'


import { CatalogPage } from '@/app/pages/CatalogPage'
import { CartPage } from '@/app/pages/CartPage'
import { CheckoutPage } from '@/app/pages/CheckoutPage'
import { OrdersPage, OrderDetailPage, OrderSuccessPage } from '@/app/pages/OrdersPage'
import { AdminOrdersPage } from '@/admin/pages/AdminOrdersPage'
import { ProfilePage } from '@/app/pages/ProfilePage'
import { WelcomePage } from '@/app/pages/WelcomePage'
import { DeliveryLocationPage } from '@/app/pages/DeliveryLocationPage'
import { TrackingPage } from '@/app/pages/TrackingPage'
import { useDeliveryStore } from '@/app/store'

const AdminApp = lazy(() => import('./admin/AdminApp'))

export default function App() {
  const [splashDone, setSplashDone] = useState(false)

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
        <BrowserRouter>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

function AppShell() {
  const { pathname } = useLocation()
  const { deliveryType } = useDeliveryStore()

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
      
      const webAppAny = window.Telegram.WebApp as any
      // Попытка запустить абсолютный Fullscreen (Telegram v7.7+)
      if (typeof webAppAny.requestFullscreen === 'function') {
        try {
          webAppAny.requestFullscreen()
        } catch (e) {
          console.warn('requestFullscreen is not supported', e)
        }
      }
      
      // Отключаем свайп вниз для закрытия приложения, чтобы не мешал скроллу
      if (typeof webAppAny.disableVerticalSwipes === 'function') {
        try {
          webAppAny.disableVerticalSwipes()
        } catch (e) {
          console.warn('disableVerticalSwipes is not supported', e)
        }
      }
    }
  }, [])

  // Глобальный вибро-отклик на любой тап по кнопкам/ссылкам
  useEffect(() => installGlobalHaptics(), [])

  const isAdmin = pathname.startsWith('/admin')
  const isWelcome = pathname === '/welcome'
  const isDeliveryLocation = pathname === '/delivery-location'
  const isOrderTracking = (pathname.startsWith('/orders/') && pathname !== '/orders') || pathname.startsWith('/tracking/')
  const isProfileSub = pathname.startsWith('/profile/')
  const isTracking = pathname.startsWith('/tracking/')
  const isPreAuth = isWelcome || isDeliveryLocation || isTracking
  const showNav = !isAdmin && !isPreAuth && !isOrderTracking && !isProfileSub

  if (!isAdmin && deliveryType === null && !isPreAuth) {
    return <Navigate to="/welcome" replace />
  }

  const showTopBar = !isAdmin && !isPreAuth && !isOrderTracking && !isProfileSub

  return (
    <div
      style={{
        ...(isAdmin ? {} : { maxWidth: 480 }),
        margin: '0 auto',
        position: 'relative',
        minHeight: '100dvh',
        paddingTop: 'var(--tg-safe-area-inset-top, env(safe-area-inset-top, 20px))',
      }}
    >
      {showTopBar && <TopAppBar />}

      <main style={{
        paddingTop: showTopBar ? 'var(--top-bar-height)' : 0,
        paddingBottom: isAdmin
          ? 'calc(var(--nav-height) + env(safe-area-inset-bottom))'
          : 'env(safe-area-inset-bottom)',
      }}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<div>Загрузка...</div>}>
                  <AdminApp />
                </Suspense>
              }
            />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/delivery-location" element={<DeliveryLocationPage />} />
            <Route path="/" element={<CatalogPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/order-success/:id" element={<OrderSuccessPage />} />
            <Route path="/tracking/:id" element={<TrackingPage />} />
            <Route path="/admin-orders" element={<AdminOrdersPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/personal-info" element={<ProfilePage sub="personal-info" />} />
            <Route path="/profile/addresses" element={<ProfilePage sub="addresses" />} />
            <Route path="/profile/notifications" element={<ProfilePage sub="notifications" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      {showNav && <BottomNav />}
    </div>
  )
}
