import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import { ToastProvider } from './contexts/ToastContext'
import { AuthProvider } from './contexts/AuthContext'
import { ConfirmProvider } from './contexts/ConfirmContext'
import { RequireAuth, RequireAdmin } from './components/RequireAuth'
import Layout from './components/Layout'
import MapPage from './pages/MapPage'
import MemorialsPage from './pages/MemorialsPage'
import MemorialDetailPage from './pages/MemorialDetailPage'
import RoutesPage from './pages/RoutesPage'
import RouteDetailPage from './pages/RouteDetailPage'
import ProfilePage from './pages/ProfilePage'
import AddPointPage from './pages/AddPointPage'
import AddRoutePage from './pages/AddRoutePage'
import AuthPage from './pages/AuthPage'
import AdminPage from './pages/AdminPage'
import EditProfilePage from './pages/EditProfilePage'
import MySubmissionsPage from './pages/MySubmissionsPage'
import EditMemorialPage from './pages/EditMemorialPage'
import EditRoutePage from './pages/EditRoutePage'
import NotFoundPage from './pages/NotFoundPage'
import OnboardingPage from './pages/OnboardingPage'
import SoldierProfilePage from './pages/SoldierProfilePage'
import CommunityFeedPage from './pages/CommunityFeedPage'
import ActiveNavigationPage from './pages/ActiveNavigationPage'

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState(
    () => !!localStorage.getItem('ntz_onboarded')
  )

  useEffect(() => {
    const handler = () => setIsOnboarded(true)
    window.addEventListener('ntz:onboarded', handler)
    return () => window.removeEventListener('ntz:onboarded', handler)
  }, [])

  return (
    <ToastProvider>
    <AuthProvider>
    <AppProvider>
    <ConfirmProvider>
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/routes/:id/navigate" element={<ActiveNavigationPage />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to={isOnboarded ? '/map' : '/onboarding'} replace />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/memorials" element={<MemorialsPage />} />
        <Route path="/memorials/:id" element={<MemorialDetailPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/routes/:id" element={<RouteDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit"    element={<RequireAuth><EditProfilePage /></RequireAuth>} />
        <Route path="/my-submissions"  element={<RequireAuth><MySubmissionsPage /></RequireAuth>} />
        <Route path="/edit-point/:id"  element={<RequireAuth><EditMemorialPage /></RequireAuth>} />
        <Route path="/edit-route/:id"  element={<RequireAuth><EditRoutePage /></RequireAuth>} />
        <Route path="/auth"    element={<AuthPage />} />
        <Route path="/add-point" element={<RequireAuth><AddPointPage /></RequireAuth>} />
        <Route path="/add-route" element={<RequireAuth><AddRoutePage /></RequireAuth>} />
        <Route path="/admin"     element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        <Route path="/soldiers/:id" element={<SoldierProfilePage />} />
        <Route path="/community" element={<CommunityFeedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </ConfirmProvider>
    </AppProvider>
    </AuthProvider>
    </ToastProvider>
  )
}
