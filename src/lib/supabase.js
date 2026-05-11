import { createClient } from '@supabase/supabase-js'

// The anon key is public by design — RLS policies are what actually protect
// data. Hardcoding the fallback lets the Android APK build work without
// needing GitHub secrets configured (otherwise the WebView gets a client with
// no key, every request 401s, and the app sits blank forever).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || 'https://abdvoipoewiuneabxyqb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZHZvaXBvZXdpdW5lYWJ4eXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0Mjg5MTAsImV4cCI6MjA5NDAwNDkxMH0.a9CI3g1OcXyYswFCXhwnfrM4eJ4HAaJf6ZdaW_iadh0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'matemagia-auth',
  },
  global: {
    headers: { 'x-application-name': 'matemagia' },
  },
})

export default supabase
