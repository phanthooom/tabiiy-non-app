import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'

import { AuthProvider } from '@/components/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopAppBar } from '@/components/layout/TopAppBar'
import { queryClient } from '@/lib/query-client'

import { CatalogPage } from '@/pages/CatalogPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { OrdersPage, OrderDetailPage, OrderSuccessPage } from '@/pages/OrdersPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { WelcomePage } from '@/pages/WelcomePage'
import { DeliveryLocationPage } from '@/pages/DeliveryLocationPage'
import { useDeliveryStore } from '@/store'

const AdminApp = lazy(() => import('./admin/AdminApp'))

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
      window.Telegram.WebApp.expand()
    }
  }, [])

  const isAdmin = pathname.startsWith('/admin')
  const isWelcome = pathname === '/welcome'
  const isDeliveryLocation = pathname === '/delivery-location'
  const isPreAuth = isWelcome || isDeliveryLocation
  const showNav = !isAdmin && !isPreAuth

  if (!isAdmin && deliveryType === null && !isPreAuth) {
    return <Navigate to="/welcome" replace />
  }

  const showTopBar = !isAdmin && !isPreAuth

  return (
    <div
      style={{
        ...(isAdmin ? {} : { maxWidth: 480 }),
        margin: '0 auto',
        position: 'relative',
        minHeight: '100dvh',
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
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      {showNav && <BottomNav />}
    </div>
  )
}
