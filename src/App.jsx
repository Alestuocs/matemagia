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

function AppRoutes() {
  const { user, loading } = useAuth()
  const { progress } = useProgress()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-yellow-50">
        <div className="text-center animate-pulse">
          <div className="text-6xl mb-3">🪄</div>
          <p className="font-black text-magic-600 text-xl">Cargando MateMagia...</p>
        </div>
      </div>
    )
  }

  const isLessonPage = location.pathname.startsWith('/lesson')
  const showNav = !!user && !isLessonPage

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            !user
              ? <LoginPage />
              : !(progress.assessmentDone && progress.studentName)
              ? <Navigate to="/assessment" replace />
              : <Dashboard />
          }
        />
        <Route
          path="/assessment"
          element={
            !user
              ? <Navigate to="/" replace />
              : (progress.assessmentDone && progress.studentName)
              ? <Navigate to="/" replace />
              : <AssessmentPage />
          }
        />
        <Route
          path="/map"
          element={user ? <CurriculumMap /> : <Navigate to="/" replace />}
        />
        <Route
          path="/lesson/:topicId"
          element={user ? <LessonPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/games"
          element={user ? <GamesHub /> : <Navigate to="/" replace />}
        />
        <Route
          path="/achievements"
          element={user ? <AchievementsPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/profile"
          element={user ? <ProfilePage /> : <Navigate to="/" replace />}
        />
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
