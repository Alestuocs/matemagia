import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { CURRICULUM, ACHIEVEMENTS } from '../lib/curriculum'

const ProgressContext = createContext(null)

const DEFAULT_PROGRESS = {
  xp: 0,
  streak: 0,
  lastStudyDate: null,
  unlockedTopics: ['numbers-0-10'],
  completedTopics: [],
  topicStars: {},      // topicId → 1|2|3
  exercisesTotal: 0,
  exercisesToday: 0,
  correctTotal: 0,
  dailyGoal: 5,
  dailyGoalDone: 0,
  achievements: [],
  currentGrade: 1,
  studentName: '',
  assessmentDone: false,
  lastDate: null,
}

function loadLocal() {
  try {
    const saved = localStorage.getItem('mm_progress')
    if (saved) return { ...DEFAULT_PROGRESS, ...JSON.parse(saved) }
  } catch (_) {}
  return { ...DEFAULT_PROGRESS }
}

function saveLocal(progress) {
  try {
    localStorage.setItem('mm_progress', JSON.stringify(progress))
  } catch (_) {}
}

export function ProgressProvider({ children }) {
  const { user } = useAuth()
  const [progress, setProgress] = useState(loadLocal)
  const [loading, setLoading] = useState(false)

  // Sync progress to/from Supabase when user changes
  useEffect(() => {
    if (!user) return
    loadFromSupabase()
  }, [user?.id])

  async function loadFromSupabase() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data && !error) {
        const remote = {
          ...DEFAULT_PROGRESS,
          xp: data.xp || 0,
          streak: data.streak || 0,
          lastStudyDate: data.last_study_date,
          unlockedTopics: data.unlocked_topics || ['numbers-0-10'],
          completedTopics: data.completed_topics || [],
          topicStars: data.topic_stars || {},
          exercisesTotal: data.exercises_total || 0,
          exercisesToday: data.exercises_today || 0,
          correctTotal: data.correct_total || 0,
          dailyGoal: data.daily_goal || 5,
          dailyGoalDone: data.daily_goal_done || 0,
          achievements: data.achievements || [],
          currentGrade: data.current_grade || 1,
          studentName: data.student_name || '',
          assessmentDone: data.assessment_done || false,
        }
        setProgress(remote)
        saveLocal(remote)
      } else {
        // Use local data, try to create remote entry
        const local = loadLocal()
        await supabase.from('user_progress').upsert({
          user_id: user.id,
          xp: local.xp,
          streak: local.streak,
          unlocked_topics: local.unlockedTopics,
          completed_topics: local.completedTopics,
          topic_stars: local.topicStars,
          exercises_total: local.exercisesTotal,
          exercises_today: local.exercisesToday,
          correct_total: local.correctTotal,
          daily_goal: local.dailyGoal,
          daily_goal_done: local.dailyGoalDone,
          achievements: local.achievements,
          current_grade: local.currentGrade,
          student_name: local.studentName,
          assessment_done: local.assessmentDone,
        })
      }
    } catch (e) {
      console.warn('Supabase load error, using local:', e)
    } finally {
      setLoading(false)
    }
  }

  const persistProgress = useCallback(async (newProgress) => {
    setProgress(newProgress)
    saveLocal(newProgress)
    if (!user) return
    try {
      await supabase.from('user_progress').upsert({
        user_id: user.id,
        xp: newProgress.xp,
        streak: newProgress.streak,
        last_study_date: newProgress.lastStudyDate,
        unlocked_topics: newProgress.unlockedTopics,
        completed_topics: newProgress.completedTopics,
        topic_stars: newProgress.topicStars,
        exercises_total: newProgress.exercisesTotal,
        exercises_today: newProgress.exercisesToday,
        correct_total: newProgress.correctTotal,
        daily_goal: newProgress.dailyGoal,
        daily_goal_done: newProgress.dailyGoalDone,
        achievements: newProgress.achievements,
        current_grade: newProgress.currentGrade,
        student_name: newProgress.studentName,
        assessment_done: newProgress.assessmentDone,
        updated_at: new Date().toISOString(),
      })
    } catch (e) {
      console.warn('Supabase save error:', e)
    }
  }, [user])

  // Check and update streak on each load
  useEffect(() => {
    const today = new Date().toDateString()
    if (progress.lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      const newStreak = progress.lastDate === yesterday ? progress.streak : 0
      const updated = { ...progress, lastDate: today, exercisesToday: 0, dailyGoalDone: 0, streak: newStreak }
      setProgress(updated)
      saveLocal(updated)
    }
  }, [])

  function saveAttempt(topicId, isCorrect, xpReward = 10) {
    const today = new Date().toDateString()
    const updated = {
      ...progress,
      exercisesTotal: progress.exercisesTotal + 1,
      exercisesToday: progress.exercisesToday + 1,
      correctTotal: isCorrect ? progress.correctTotal + 1 : progress.correctTotal,
      xp: isCorrect ? progress.xp + xpReward : progress.xp,
      dailyGoalDone: isCorrect ? progress.dailyGoalDone + 1 : progress.dailyGoalDone,
      lastDate: today,
      lastStudyDate: today,
    }
    // Update streak
    if (isCorrect) {
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      if (progress.lastStudyDate !== today) {
        updated.streak = progress.lastStudyDate === yesterday ? progress.streak + 1 : 1
      }
    }
    // Check achievements
    const newAchievements = checkAchievements(updated)
    updated.achievements = [...new Set([...updated.achievements, ...newAchievements])]
    persistProgress(updated)
    return newAchievements
  }

  function completeTopic(topicId, stars = 3) {
    const topicIndex = CURRICULUM.findIndex(t => t.id === topicId)
    const nextTopic = CURRICULUM[topicIndex + 1]
    const updated = {
      ...progress,
      completedTopics: [...new Set([...progress.completedTopics, topicId])],
      topicStars: { ...progress.topicStars, [topicId]: stars },
      unlockedTopics: nextTopic
        ? [...new Set([...progress.unlockedTopics, nextTopic.id])]
        : progress.unlockedTopics,
    }
    const newAchievements = checkAchievements(updated)
    updated.achievements = [...new Set([...updated.achievements, ...newAchievements])]
    persistProgress(updated)
    return { newAchievements, nextTopic }
  }

  function checkAchievements(p) {
    const earned = []
    const has = (id) => p.achievements.includes(id)

    if (!has('first-lesson') && p.completedTopics.length >= 1) earned.push('first-lesson')
    if (!has('first-sum') && p.completedTopics.includes('addition-simple')) earned.push('first-sum')
    if (!has('streak-3') && p.streak >= 3) earned.push('streak-3')
    if (!has('streak-7') && p.streak >= 7) earned.push('streak-7')
    if (!has('xp-100') && p.xp >= 100) earned.push('xp-100')
    if (!has('xp-500') && p.xp >= 500) earned.push('xp-500')
    if (!has('exercises-10') && p.exercisesTotal >= 10) earned.push('exercises-10')
    if (!has('exercises-50') && p.exercisesTotal >= 50) earned.push('exercises-50')
    if (!has('exercises-100') && p.exercisesTotal >= 100) earned.push('exercises-100')
    if (!has('multiplication-master') && p.completedTopics.includes('multiplication-6-10')) earned.push('multiplication-master')

    // Grade completions
    for (let g = 1; g <= 6; g++) {
      const gradeTopics = CURRICULUM.filter(t => t.gradeLevel === g).map(t => t.id)
      if (!has(`grade${g}-complete`) && gradeTopics.every(id => p.completedTopics.includes(id))) {
        earned.push(`grade${g}-complete`)
      }
    }

    if (!has('all-complete') && p.completedTopics.length >= CURRICULUM.length) earned.push('all-complete')

    return earned
  }

  function setProfile(name, grade) {
    const updated = { ...progress, studentName: name, currentGrade: grade, assessmentDone: true }
    const firstTopics = CURRICULUM.filter(t => t.gradeLevel <= grade).map(t => t.id).slice(0, 3)
    updated.unlockedTopics = [...new Set([...progress.unlockedTopics, ...firstTopics])]
    persistProgress(updated)
  }

  function setDailyGoal(goal) {
    persistProgress({ ...progress, dailyGoal: goal })
  }

  function resetProgress() {
    persistProgress({ ...DEFAULT_PROGRESS })
  }

  const value = {
    progress,
    loading,
    saveAttempt,
    completeTopic,
    setProfile,
    setDailyGoal,
    resetProgress,
    persistProgress,
  }

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const context = useContext(ProgressContext)
  if (!context) throw new Error('useProgress must be used within ProgressProvider')
  return context
}
