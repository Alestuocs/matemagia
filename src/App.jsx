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
import ErrorBoundary from './components/ui/ErrorBoundary'
import PersistErrorToast from './components/ui/PersistErrorToast'

const LoadingScreen = ({ text = 'Cargando MateMagia...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-yellow-50">
    <div className="text-center animate-pulse">
      <img src={import.meta.env.BASE_URL + 'logo.png'} alt="MateMagia" className="w-24 h-24 mx-auto mb-3 object-contain" />
      <p className="font-black text-magic-600 text-xl">{text}</p>
    </div>
  </div>
)

function AppRoutes() {
  const { user, loading } = useAuth()
  const { progress, synced, dbConfirmed } = useProgress()
  const location = useLocation()

  // Auth still resolving
  if (loading) return <LoadingScreen />

  // User is logged in but Supabase hasn't been consulted yet — wait.
  if (user && !synced) return <LoadingScreen text="Cargando tu perfil…" />

  const isLessonPage = location.pathname.startsWith('/lesson')
  const isParent = progress.role === 'parent'
  const showNav = !!user && !isLessonPage && !isParent

  // CRITICAL: only force the role-picker redirect when the DB itself
  // confirmed this user has no completed assessment. If the sync only
  // flipped via the safety timer (no DB confirmation), we DO NOT route
  // existing users to /assessment — that's how Grecia and others ended
  // up re-onboarding by accident.
  const needsAssessment = dbConfirmed
    && !(progress.assessmentDone && progress.studentName)
    && progress.role !== 'parent'

  return (
    <>
      <Routes>
        <Route path="/" element={
          !user ? <LoginPage /> :
          needsAssessment ? <Navigate to="/assessment" replace /> :
          isParent ? <ParentDashboard /> :
          <Dashboard />
        } />
        <Route path="/assessment" element={
          !user ? <Navigate to="/" replace /> :
          !needsAssessment ? <Navigate to="/" replace /> :
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
      {user && <PersistErrorToast />}
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProgressProvider>
          <AppRoutes />
        </ProgressProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
