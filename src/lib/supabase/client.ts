const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function getStorageKey() {
  try {
    const ref = new URL(SUPABASE_URL).hostname.split('.')[0]
    return `sb-${ref}-auth-token`
  } catch { return 'sb-auth-token' }
}

export function getStoredSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getStorageKey())
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
  }
  const session = getStoredSession()
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  } else {
    headers['Authorization'] = `Bearer ${SUPABASE_KEY}`
  }
  return headers
}

// Lightweight Supabase REST wrapper — no @supabase/supabase-js dependency in browser
function createQueryBuilder(table: string) {
  let url = `${SUPABASE_URL}/rest/v1/${table}`
  const params: string[] = []
  let method = 'GET'
  let body: string | undefined
  const extraHeaders: Record<string, string> = {}

  const builder = {
    select(columns = '*') {
      params.push(`select=${encodeURIComponent(columns)}`)
      return builder
    },
    insert(data: unknown) {
      method = 'POST'
      body = JSON.stringify(data)
      extraHeaders['Prefer'] = 'return=representation'
      return builder
    },
    update(data: unknown) {
      method = 'PATCH'
      body = JSON.stringify(data)
      extraHeaders['Prefer'] = 'return=representation'
      return builder
    },
    delete() {
      method = 'DELETE'
      return builder
    },
    eq(col: string, val: unknown) {
      params.push(`${col}=eq.${val}`)
      return builder
    },
    neq(col: string, val: unknown) {
      params.push(`${col}=neq.${val}`)
      return builder
    },
    gt(col: string, val: unknown) {
      params.push(`${col}=gt.${val}`)
      return builder
    },
    gte(col: string, val: unknown) {
      params.push(`${col}=gte.${val}`)
      return builder
    },
    lt(col: string, val: unknown) {
      params.push(`${col}=lt.${val}`)
      return builder
    },
    lte(col: string, val: unknown) {
      params.push(`${col}=lte.${val}`)
      return builder
    },
    in(col: string, vals: unknown[]) {
      params.push(`${col}=in.(${vals.join(',')})`)
      return builder
    },
    is(col: string, val: unknown) {
      params.push(`${col}=is.${val}`)
      return builder
    },
    ilike(col: string, val: string) {
      params.push(`${col}=ilike.${encodeURIComponent(val)}`)
      return builder
    },
    or(conditions: string) {
      params.push(`or=(${encodeURIComponent(conditions)})`)
      return builder
    },
    order(col: string, opts?: { ascending?: boolean }) {
      const dir = opts?.ascending === false ? 'desc' : 'asc'
      params.push(`order=${col}.${dir}`)
      return builder
    },
    limit(n: number) {
      params.push(`limit=${n}`)
      return builder
    },
    range(from: number, to: number) {
      extraHeaders['Range'] = `${from}-${to}`
      return builder
    },
    single() {
      extraHeaders['Accept'] = 'application/vnd.pgrst.object+json'
      return execute()
    },
    maybeSingle() {
      extraHeaders['Accept'] = 'application/vnd.pgrst.object+json'
      return execute(true)
    },
    then<T>(resolve: (v: { data: any; error: any }) => T, reject?: (e: any) => any): Promise<T> {
      return execute().then(resolve, reject)
    },
  }

  function execute(maybe = false): Promise<{ data: any; error: any }> {
    const fullUrl = params.length ? `${url}?${params.join('&')}` : url
    return window.fetch(fullUrl, {
      method,
      headers: { ...getAuthHeaders(), ...extraHeaders },
      body,
    }).then(async (res) => {
      if (maybe && res.status === 406) return { data: null, error: null }
      const text = await res.text()
      const data = text ? JSON.parse(text) : null
      if (!res.ok) return { data: null, error: data }
      return { data, error: null }
    }).catch((e) => ({ data: null, error: e }))
  }

  return builder
}

// RPC call wrapper
async function rpc(fn: string, params?: Record<string, unknown>) {
  const res = await window.fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params ?? {}),
  })
  const data = await res.json()
  if (!res.ok) return { data: null, error: data }
  return { data, error: null }
}

interface SupabaseClientLike {
  from: (table: string) => ReturnType<typeof createQueryBuilder>
  rpc: typeof rpc
  auth: {
    getSession: () => Promise<{ data: { session: any }; error: any }>
    getUser: () => Promise<{ data: { user: any }; error: any }>
    setSession: (s: { access_token: string; refresh_token: string }) => Promise<any>
    signOut: () => Promise<any>
    onAuthStateChange: (cb: any) => { data: { subscription: { unsubscribe: () => void } } }
  }
}

let _client: SupabaseClientLike | null = null

export function createClient(): SupabaseClientLike {
  if (_client) return _client

  _client = {
    from: (table: string) => createQueryBuilder(table),
    rpc,
    auth: {
      async getSession() {
        const session = getStoredSession()
        return { data: { session }, error: null }
      },
      async getUser() {
        const session = getStoredSession()
        return { data: { user: session?.user ?? null }, error: null }
      },
      async setSession(s) {
        localStorage.setItem(getStorageKey(), JSON.stringify(s))
        return { data: { session: s }, error: null }
      },
      async signOut() {
        localStorage.removeItem(getStorageKey())
        return { error: null }
      },
      onAuthStateChange() {
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
    },
  }

  return _client
}
