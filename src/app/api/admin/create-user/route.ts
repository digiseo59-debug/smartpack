import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const serverSupabase = await createServerSupabaseClient()
  const { data: { user } } = await serverSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  const { data: profile } = await serverSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 })
  }

  const { email, password, full_name, role } = await request.json()

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: role ?? 'salarie' },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ user: data.user })
}
