import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProgressProvider, useProgress } from './contexts/ProgressContext'
import BottomNav from './components/layout/BottomNav'
import LoginPage from './pages/LoginPage'
import AssessmentPage from './pages/AssessmentPage'
import Dashboard from './pages/Dashboard'
import CurriculumMap from './pages/CurriculumMap'
import LessonPage from './pages/LessonPage'
import GamesHub from './pages/GamesHub'
import AchievementsPage from './pages/AchievementsPage'
import ProfilePage from './pages/ProfilePage'
import MathChat from './pages/MathChat'
import PracticeMode from './pages/PracticeMode'
import ParentDashboard from './pages/ParentDashboard'

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-yellow-50">
    <div className="text-center animate-pulse">
      <img src="/matemagia/logo.png" alt="MateMagia" className="w-24 h-24 mx-auto mb-3 object-contain" />
      <p className="font-black text-magic-600 text-xl">Cargando MateMagia...</p>
    </div>
  </div>
)

function AppRoutes() {
  const { user, loading } = useAuth()
  const { progress, synced } = useProgress()
  const location = useLocation()

  // Auth still resolving
  if (loading) return <LoadingScreen />

  // User is logged in but Supabase progress hasn't loaded yet — avoid premature redirect
  if (user && !synced) return <LoadingScreen />

  const isLessonPage = location.pathname.startsWith('/lesson')
  const isParent = progress.role === 'parent'
  const showNav = !!user && !isLessonPage && !isParent

  return (
    <>
      <Routes>
        <Route path="/" element={
          !user ? <LoginPage /> :
          !(progress.assessmentDone && progress.studentName) && progress.role !== 'parent' ? <Navigate to="/assessment" replace /> :
          isParent ? <ParentDashboard /> :
          <Dashboard />
        } />
        <Route path="/assessment" element={
          !user ? <Navigate to="/" replace /> :
          (progress.assessmentDone && progress.studentName) || progress.role === 'parent' ? <Navigate to="/" replace /> :
          <AssessmentPage />
        } />
        <Route path="/map" element={user ? <CurriculumMap /> : <Navigate to="/" replace />} />
        <Route path="/lesson/:topicId" element={user ? <LessonPage /> : <Navigate to="/" replace />} />
        <Route path="/games" element={user ? <GamesHub /> : <Navigate to="/" replace />} />
        <Route path="/achievements" element={user ? <AchievementsPage /> : <Navigate to="/" replace />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/" replace />} />
        <Route path="/chat" element={user ? <MathChat /> : <Navigate to="/" replace />} />
        <Route path="/practice" element={user ? <PracticeMode /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <AppRoutes />
      </ProgressProvider>
    </AuthProvider>
  )
}
