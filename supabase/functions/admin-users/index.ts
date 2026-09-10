import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: '認証が必要です' }, 401)

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) return json({ error: '認証が必要です' }, 401)

    if (user.user_metadata?.role !== 'admin') return json({ error: '管理者権限が必要です' }, 403)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const method = req.method

    // ── ユーザー一覧 ──────────────────────────────────
    if (method === 'GET') {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers()
      if (error) return json({ error: error.message }, 500)

      const users = data.users.map(u => ({
        id: u.id,
        email: u.email,
        employee_id:  u.user_metadata?.employee_id  ?? '',
        display_name: u.user_metadata?.display_name ?? '',
        department:   u.user_metadata?.department   ?? '',
        position:     u.user_metadata?.position     ?? '',
        role:         u.user_metadata?.role         ?? 'viewer',
        created_at:      u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }))
      return json({ users })
    }

    // ── ユーザー作成 ──────────────────────────────────
    if (method === 'POST') {
      const { email, password, role: newRole, display_name, employee_id, department, position } = await req.json()
      if (!email || !password) return json({ error: 'メールアドレスとパスワードは必須です' }, 400)

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role:         newRole      ?? 'viewer',
          display_name: display_name ?? '',
          employee_id:  employee_id  ?? '',
          department:   department   ?? '',
          position:     position     ?? '',
        },
      })
      if (error) return json({ error: error.message }, 500)
      return json({ user: data.user })
    }

    // ── ユーザー更新 ──────────────────────────────────
    if (method === 'PATCH') {
      const { user_id, role: newRole, display_name, department, position } = await req.json()
      if (!user_id || !newRole) return json({ error: 'user_id と role は必須です' }, 400)

      const { data: existing } = await supabaseAdmin.auth.admin.getUserById(user_id)
      const existingMeta = existing?.user?.user_metadata ?? {}

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        user_metadata: {
          ...existingMeta,
          role:         newRole,
          display_name: display_name ?? existingMeta.display_name ?? '',
          department:   department   ?? existingMeta.department   ?? '',
          position:     position     ?? existingMeta.position     ?? '',
        },
      })
      if (error) return json({ error: error.message }, 500)
      return json({ user: data.user })
    }

    // ── ユーザー削除 ──────────────────────────────────
    if (method === 'DELETE') {
      const { user_id } = await req.json()
      if (!user_id) return json({ error: 'user_id は必須です' }, 400)
      if (user_id === user.id) return json({ error: '自分自身は削除できません' }, 400)

      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id)
      if (error) return json({ error: error.message }, 500)
      return json({ success: true })
    }

    // ── ロールデフォルト更新 (PUT) ─────────────────────
    if (method === 'PUT') {
      const { resource, department, position, role } = await req.json()
      if (resource !== 'role-defaults') return json({ error: 'unknown resource' }, 400)
      if (!department || !position || !role) return json({ error: 'department/position/role は必須です' }, 400)

      const { error } = await supabaseAdmin
        .from('role_defaults')
        .upsert({ department, position, role }, { onConflict: 'department,position' })
      if (error) return json({ error: error.message }, 500)
      return json({ success: true })
    }

    return json({ error: 'Method not allowed' }, 405)

  } catch (e) {
    return json({ error: e.message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
