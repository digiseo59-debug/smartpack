import { createClient as supabaseCreateClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any, 'public', any> | null = null

export function getStorageKey() {
  const ref = new URL(SUPABASE_URL).hostname.split('.')[0]
  return `sb-${ref}-auth-token`
}

export function getStoredSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getStorageKey())
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const session = getStoredSession()
  const headers = new Headers(init?.headers)
  if (session?.access_token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  return window.fetch(input, { ...init, headers })
}

export function createClient() {
  if (typeof window === 'undefined') {
    return supabaseCreateClient(SUPABASE_URL, SUPABASE_KEY)
  }

  if (_client) return _client

  _client = supabaseCreateClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      flowType: 'implicit',
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: authFetch,
    },
  })

  return _client
}
