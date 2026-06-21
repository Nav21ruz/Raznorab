import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { AuthPage } from './pages/AuthPage'
import { ObjectsPage } from './pages/ObjectsPage'
import { ObjectDetailPage } from './pages/ObjectDetailPage'
import { NewEntryPage } from './pages/NewEntryPage'
import { EntryDetailPage } from './pages/EntryDetailPage'
import { SharePage } from './pages/SharePage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30, retry: 1 } },
})

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      queryClient.clear()
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/share/:token" element={<SharePage />} />
          {session ? (
            <>
              <Route path="/" element={<ObjectsPage />} />
              <Route path="/objects/:id" element={<ObjectDetailPage />} />
              <Route path="/objects/:id/new-entry" element={<NewEntryPage />} />
              <Route path="/entries/:id" element={<EntryDetailPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
