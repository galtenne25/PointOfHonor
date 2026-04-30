import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import MapPage from './pages/MapPage'
import MemorialsPage from './pages/MemorialsPage'
import RoutesPage from './pages/RoutesPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/map" replace />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/memorials" element={<MemorialsPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}
