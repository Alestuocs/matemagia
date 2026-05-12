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
  topicLevels: {},     // topicId → 1..5 difficulty level
  exercisesTotal: 0,
  exercisesToday: 0,
  correctTotal: 0,
  dailyGoal: 5,
  dailyGoalDone: 0,
  achievements: [],
  currentGrade: 1,
  studentName: '',
  parentEmail: '',
  assessmentDone: false,
  lastDate: null,
  role: 'student',
  inviteCode: '',      // read-only from DB, not written back
}

// localStorage is namespaced per user.id. The previous shared key
// `mm_progress` caused cross-user contamination: if two accounts used the
// same browser, one's cached state could leak into the other's first
// render and (worse) be persisted back to DB.
const CACHE_PREFIX = 'mm_progress:'

function cacheKey(userId) {
  return userId ? `${CACHE_PREFIX}${userId}` : null
}

function loadLocal(userId) {
  if (!userId) return { ...DEFAULT_PROGRESS }
  try {
    const saved = localStorage.getItem(cacheKey(userId))
    if (saved) return { ...DEFAULT_PROGRESS, ...JSON.parse(saved) }
  } catch (_) {}
  return { ...DEFAULT_PROGRESS }
}

function saveLocal(userId, progress) {
  if (!userId) return
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(progress))
  } catch (_) {}
}

// One-time migration: previous versions used a single `mm_progress`
// key. Clear it to avoid it ever overriding new user-scoped data.
try { localStorage.removeItem('mm_progress') } catch (_) {}

export function ProgressProvider({ children }) {
  const { user } = useAuth()
  // IMPORTANT: never initialize from another user's cache. Start with
  // defaults; loadFromSupabase + the user-scoped cache will hydrate.
  const [progress, setProgress] = useState({ ...DEFAULT_PROGRESS })
  const [loading, setLoading] = useState(false)
  const [synced, setSynced] = useState(false)
  // `dbConfirmed` flips to true only after a successful read (or
  // bootstrap+reread) from Supabase. UI navigation that depends on real
  // server state should gate on this flag, NOT on `synced`, which may
  // have flipped via the safety timer.
  const [dbConfirmed, setDbConfirmed] = useState(false)
  const [persistError, setPersistError] = useState(null)

  // Sync progress to/from Supabase when user changes
  useEffect(() => {
    if (!user) {
      setProgress({ ...DEFAULT_PROGRESS })
      setSynced(true)
      setDbConfirmed(false)
      return
    }
    // First paint: hydrate from THIS user's local cache (instant) while
    // we wait for the DB read. If there's no cache, we stay on defaults
    // until DB confirms.
    const cached = loadLocal(user.id)
    setProgress(cached)
    setSynced(false)
    setDbConfirmed(false)
    // Safety timeout bumped to 12s. Even if it fires, dbConfirmed stays
    // false so navigation guards still know we don't trust the data.
    const safetyTimer = setTimeout(() => setSynced(true), 12000)
    loadFromSupabase().finally(() => clearTimeout(safetyTimer))
  }, [user?.id])

  async function loadFromSupabase() {
    setLoading(true)
    try {
      let { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        // RLS / network error — keep whatever local state we already have.
        // CRITICAL: never write back to DB here, or we overwrite real progress
        // with stale defaults on transient failures.
        console.warn('user_progress read failed; keeping local cache:', error.message)
        return
      }

      if (!data) {
        // No row yet — bootstrap one then re-read.
        await supabase
          .from('user_progress')
          .upsert({ user_id: user.id }, { onConflict: 'user_id' })
        const reread = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        if (!reread.data) {
          console.warn('user_progress bootstrap failed; keeping in-memory state')
          return
        }
        data = reread.data
      }

      setDbConfirmed(true)
      const remote = {
        ...DEFAULT_PROGRESS,
        xp: data.xp || 0,
        streak: data.streak || 0,
        lastStudyDate: data.last_study_date,
        unlockedTopics: data.unlocked_topics || ['numbers-0-10'],
        completedTopics: data.completed_topics || [],
        topicStars: data.topic_stars || {},
        topicLevels: data.topic_levels || {},
        exercisesTotal: data.exercises_total || 0,
        exercisesToday: data.exercises_today || 0,
        correctTotal: data.correct_total || 0,
        dailyGoal: data.daily_goal || 5,
        dailyGoalDone: data.daily_goal_done || 0,
        achievements: data.achievements || [],
        currentGrade: data.current_grade || 1,
        studentName: data.student_name || '',
        parentEmail: data.parent_email || '',
        assessmentDone: data.assessment_done || false,
        role: data.role || 'student',
        inviteCode: data.invite_code || '',
      }
      setProgress(remote)
      saveLocal(user.id, remote)
    } catch (e) {
      console.warn('Supabase load error (caught):', e)
    } finally {
      setLoading(false)
      setSynced(true)
    }
  }

  const persistProgress = useCallback(async (newProgress) => {
    setProgress(newProgress)
    if (user?.id) saveLocal(user.id, newProgress)
    if (!user) return
    try {
      // Explicit onConflict: 'user_id' — there's a UNIQUE constraint on
      // user_progress.user_id and we want UPDATE-on-conflict, never INSERT
      // a duplicate row.
      await supabase.from('user_progress').upsert({
        user_id: user.id,
        xp: newProgress.xp,
        streak: newProgress.streak,
        last_study_date: newProgress.lastStudyDate,
        unlocked_topics: newProgress.unlockedTopics,
        completed_topics: newProgress.completedTopics,
        topic_stars: newProgress.topicStars,
        topic_levels: newProgress.topicLevels || {},
        exercises_total: newProgress.exercisesTotal,
        exercises_today: newProgress.exercisesToday,
        correct_total: newProgress.correctTotal,
        daily_goal: newProgress.dailyGoal,
        daily_goal_done: newProgress.dailyGoalDone,
        achievements: newProgress.achievements,
        current_grade: newProgress.currentGrade,
        student_name: newProgress.studentName,
        parent_email: newProgress.parentEmail,
        assessment_done: newProgress.assessmentDone,
        role: newProgress.role || 'student',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      // Success — clear any prior persist error.
      setPersistError(null)
    } catch (e) {
      console.warn('Supabase save error:', e)
      setPersistError(e?.message || 'No se pudo guardar tu progreso.')
      // Best-effort retry once after 3s — handles transient network blips.
      setTimeout(() => {
        supabase.from('user_progress').upsert({
          user_id: user.id,
          xp: newProgress.xp,
          streak: newProgress.streak,
          last_study_date: newProgress.lastStudyDate,
          unlocked_topics: newProgress.unlockedTopics,
          completed_topics: newProgress.completedTopics,
          topic_stars: newProgress.topicStars,
          topic_levels: newProgress.topicLevels || {},
          exercises_total: newProgress.exercisesTotal,
          exercises_today: newProgress.exercisesToday,
          correct_total: newProgress.correctTotal,
          daily_goal: newProgress.dailyGoal,
          daily_goal_done: newProgress.dailyGoalDone,
          achievements: newProgress.achievements,
          current_grade: newProgress.currentGrade,
          student_name: newProgress.studentName,
          parent_email: newProgress.parentEmail,
          assessment_done: newProgress.assessmentDone,
          role: newProgress.role || 'student',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' }).then(({ error }) => {
          if (!error) setPersistError(null)
        })
      }, 3000)
    }
  }, [user])

  // Streak / daily-counter reset.
  // CRITICAL: only run AFTER we've synced with Supabase, otherwise the
  // closure captures the empty default state and we'd save zeros over the
  // real progress. We also persist to DB so the new lastDate is durable.
  useEffect(() => {
    if (!synced || !user) return
    const today = new Date().toDateString()
    if (progress.lastDate === today) return
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const newStreak = progress.lastDate === yesterday ? progress.streak : 0
    persistProgress({
      ...progress,
      lastDate: today,
      exercisesToday: 0,
      dailyGoalDone: 0,
      streak: newStreak,
    })
  }, [synced, user?.id])

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

    // Fire-and-forget granular attempt log (used by the parent dashboard).
    if (user) {
      supabase
        .from('exercise_attempts')
        .insert({
          user_id: user.id,
          topic_id: topicId,
          is_correct: isCorrect,
          xp_earned: isCorrect ? xpReward : 0,
        })
        .then(({ error }) => {
          if (error) console.warn('attempt log failed:', error.message)
        })
    }

    return newAchievements
  }

  function completeTopic(topicId, stars = 3) {
    const completedTopic = CURRICULUM.find(t => t.id === topicId)
    const topicIndex = CURRICULUM.findIndex(t => t.id === topicId)
    const nextTopic = CURRICULUM[topicIndex + 1]
    const currentGrade = progress.currentGrade || 1

    // Grade-gating rule:
    //  - Next topic in the SAME grade  → always unlock.
    //  - Next topic in a HIGHER grade  → only unlock if completing the
    //    last topic of the student's current grade (i.e. the student
    //    finished their grade and earned access to the next one).
    let shouldUnlockNext = false
    if (nextTopic) {
      if (nextTopic.gradeLevel === completedTopic.gradeLevel) {
        shouldUnlockNext = true
      } else if (nextTopic.gradeLevel > completedTopic.gradeLevel) {
        // Crossing a grade boundary. Only unlock if this is the last
        // topic of the student's CURRENT grade (their next grade is
        // earned by finishing this one).
        if (completedTopic.gradeLevel === currentGrade) {
          const lastOfGrade = CURRICULUM
            .filter(t => t.gradeLevel === currentGrade)
            .slice(-1)[0]
          shouldUnlockNext = lastOfGrade && lastOfGrade.id === topicId
        }
      }
    }

    const updated = {
      ...progress,
      completedTopics: [...new Set([...progress.completedTopics, topicId])],
      topicStars: { ...progress.topicStars, [topicId]: stars },
      unlockedTopics: shouldUnlockNext
        ? [...new Set([...progress.unlockedTopics, nextTopic.id])]
        : progress.unlockedTopics,
    }
    const newAchievements = checkAchievements(updated)
    updated.achievements = [...new Set([...updated.achievements, ...newAchievements])]
    persistProgress(updated)
    return { newAchievements, nextTopic: shouldUnlockNext ? nextTopic : null }
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
    for (let g = 1; g <= 8; g++) {
      const gradeTopics = CURRICULUM.filter(t => t.gradeLevel === g).map(t => t.id)
      if (!has(`grade${g}-complete`) && gradeTopics.every(id => p.completedTopics.includes(id))) {
        earned.push(`grade${g}-complete`)
      }
    }

    if (!has('all-complete') && p.completedTopics.length >= CURRICULUM.length) earned.push('all-complete')

    return earned
  }

  // setProfile now accepts role and parentEmail
  function setProfile(name, grade, role = 'student', parentEmail = '') {
    const updated = {
      ...progress,
      studentName: name,
      currentGrade: grade,
      parentEmail,
      assessmentDone: true,
      role,
    }
    if (role === 'parent') {
      // Parents don't need topic unlocks
      updated.assessmentDone = true
    } else {
      // Unlock ALL topics up to and including the student's grade level
      const allTopicsUpToGrade = CURRICULUM.filter(t => t.gradeLevel <= grade).map(t => t.id)
      updated.unlockedTopics = [...new Set([...progress.unlockedTopics, ...allTopicsUpToGrade])]
    }
    persistProgress(updated)
  }

  function setDailyGoal(goal) {
    persistProgress({ ...progress, dailyGoal: goal })
  }

  async function refreshProgress() {
    if (!user) return
    await loadFromSupabase()
  }

  // Save exercise hash to localStorage to prevent repeats
  function saveExerciseHash(topicId, hash) {
    try {
      const key = `mm_ex_${topicId}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      if (!existing.includes(hash)) {
        existing.push(hash)
        // Keep last 200 per topic to avoid unbounded growth
        if (existing.length > 200) existing.splice(0, existing.length - 200)
        localStorage.setItem(key, JSON.stringify(existing))
      }
    } catch (_) {}
  }

  // Check if an exercise has been seen before
  function wasExerciseSeen(topicId, hash) {
    try {
      const key = `mm_ex_${topicId}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      return existing.includes(hash)
    } catch (_) {
      return false
    }
  }

  function getTopicLevel(topicId) {
    return (progress.topicLevels && progress.topicLevels[topicId]) || 1
  }

  function setTopicLevel(topicId, level) {
    const clamped = Math.max(1, Math.min(5, Math.floor(level)))
    const next = { ...(progress.topicLevels || {}), [topicId]: clamped }
    persistProgress({ ...progress, topicLevels: next })
  }

  const value = {
    progress,
    loading,
    synced,
    dbConfirmed,
    persistError,
    saveAttempt,
    completeTopic,
    setProfile,
    setDailyGoal,
    persistProgress,
    saveExerciseHash,
    wasExerciseSeen,
    refreshProgress,
    getTopicLevel,
    setTopicLevel,
    inviteCode: progress.inviteCode,
  }

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const context = useContext(ProgressContext)
  if (!context) throw new Error('useProgress must be used within ProgressProvider')
  return context
}
