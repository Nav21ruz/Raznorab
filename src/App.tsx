import { Suspense, lazy, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useOutletContext } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { Toaster } from 'sonner'
import { supabase } from './lib/supabase'
import { Spinner } from './components/shared/Spinner'

// Журнал объекта (существующий инструмент для прораба) — грузится отдельным чанком,
// т.к. тянет jspdf/html2canvas/recharts, не нужные основному сценарию мини-аппа
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })))
const ObjectsPage = lazy(() => import('./pages/ObjectsPage').then((m) => ({ default: m.ObjectsPage })))
const ObjectDetailPage = lazy(() => import('./pages/ObjectDetailPage').then((m) => ({ default: m.ObjectDetailPage })))
const NewEntryPage = lazy(() => import('./pages/NewEntryPage').then((m) => ({ default: m.NewEntryPage })))
const EntryDetailPage = lazy(() => import('./pages/EntryDetailPage').then((m) => ({ default: m.EntryDetailPage })))
const SharePage = lazy(() => import('./pages/SharePage').then((m) => ({ default: m.SharePage })))
const StatsPage = lazy(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage })))

// Стройбиржа: заказчики, строители, разнорабочие
import { AuthGate } from './components/marketplace/AuthGate'
import { MarketplaceShell } from './components/marketplace/MarketplaceShell'
import { OnboardingPage } from './pages/marketplace/OnboardingPage'
import { BuilderFeedPage } from './pages/marketplace/BuilderFeedPage'
import { MyResponsesPage } from './pages/marketplace/MyResponsesPage'
import { CustomerOrdersPage } from './pages/marketplace/CustomerOrdersPage'
import { OrderCandidatesPage } from './pages/marketplace/OrderCandidatesPage'
import { LaborFeedPage } from './pages/marketplace/LaborFeedPage'
import { MyLaborTasksPage } from './pages/marketplace/MyLaborTasksPage'
import { MyLaborResponsesPage } from './pages/marketplace/MyLaborResponsesPage'
import { LaborTaskDetailPage } from './pages/marketplace/LaborTaskDetailPage'
import { ChatsListPage } from './pages/marketplace/ChatsListPage'
import { ChatPage } from './pages/marketplace/ChatPage'
import { ProfilePage } from './pages/marketplace/ProfilePage'
import { YandexCallbackPage } from './pages/marketplace/YandexCallbackPage'
import { ResetPasswordPage } from './pages/marketplace/ResetPasswordPage'
import { WebAuthPage } from './pages/marketplace/WebAuthPage'
import type { Profile } from './types/marketplace'

// Админ-панель (недоступна без записи в таблице admins — см. supabase/moderation_schema.sql)
const AdminGate = lazy(() => import('./components/admin/AdminGate').then((m) => ({ default: m.AdminGate })))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })))
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })))
const AdminWordsPage = lazy(() => import('./pages/admin/AdminWordsPage').then((m) => ({ default: m.AdminWordsPage })))

// Юридические страницы (публичные, без входа — их нужно видеть до регистрации)
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })))
const TermsPage = lazy(() => import('./pages/legal/TermsPage').then((m) => ({ default: m.TermsPage })))

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30, retry: 1 } },
})

function RoleHome() {
  const { profile } = useOutletContext<{ profile: Profile }>()
  const target = profile.role === 'customer' ? '/orders' : profile.role === 'builder' ? '/feed' : '/labor'
  return <Navigate to={target} replace />
}

function JournalGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      queryClient.clear()
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <AuthPage />

  return <Outlet />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Toaster position="top-right" richColors />
        <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center"><Spinner /></div>}>
          <Routes>
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/auth" element={<WebAuthPage />} />
            <Route path="/auth/yandex/callback" element={<YandexCallbackPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

            <Route path="/journal" element={<JournalGate />}>
              <Route index element={<ObjectsPage />} />
              <Route path="objects/:id" element={<ObjectDetailPage />} />
              <Route path="objects/:id/new-entry" element={<NewEntryPage />} />
              <Route path="entries/:id" element={<EntryDetailPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="*" element={<Navigate to="/journal" replace />} />
            </Route>

            <Route element={<AuthGate />}>
              <Route path="/onboarding" element={<OnboardingPage />} />

              <Route element={<MarketplaceShell />}>
                <Route path="/" element={<RoleHome />} />
                <Route path="/feed" element={<BuilderFeedPage />} />
                <Route path="/responses" element={<MyResponsesPage />} />
                <Route path="/orders" element={<CustomerOrdersPage />} />
                <Route path="/orders/:id/candidates" element={<OrderCandidatesPage />} />
                <Route path="/labor" element={<LaborFeedPage />} />
                <Route path="/labor/mine" element={<MyLaborTasksPage />} />
                <Route path="/labor/my-responses" element={<MyLaborResponsesPage />} />
                <Route path="/labor/:id" element={<LaborTaskDetailPage />} />
                <Route path="/chats" element={<ChatsListPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              <Route element={<MarketplaceShell nav={false} />}>
                <Route path="/chats/:id" element={<ChatPage />} />
              </Route>

              <Route path="/admin" element={<AdminGate />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="words" element={<AdminWordsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
