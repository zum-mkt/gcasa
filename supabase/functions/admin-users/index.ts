// Cria/exclui usuários (auth.users + profiles) sob demanda do painel admin.
//
// Por quê essa function existe: `supabase.auth.admin.*` só funciona com a
// service_role key, que nunca pode ir pro bundle do navegador (ela ignora RLS
// por completo). Essa function roda no servidor, recebe automaticamente as
// variáveis SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY do
// próprio projeto Supabase (não precisa configurar nada manualmente), e só
// executa a ação privilegiada depois de confirmar que quem chamou é admin.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autenticado.' }, 200)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Cliente "como o chamador" — só pra descobrir quem é e checar profiles.role.
    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: { user }, error: userError } = await callerClient.auth.getUser()
    if (userError || !user) return json({ error: 'Sessão inválida.' }, 200)

    const { data: callerProfile } = await callerClient.from('profiles').select('role').eq('id', user.id).single()
    if (callerProfile?.role !== 'admin') return json({ error: 'Só administradores podem gerenciar usuários.' }, 200)

    // Cliente com service_role — só a partir daqui, depois do gate de admin acima.
    const adminClient = createClient(supabaseUrl, serviceKey)
    const body = await req.json()

    if (body.action === 'create') {
      const { email, password, name, role, associate_id } = body
      if (!email || !password || !name) return json({ error: 'Nome, email e senha são obrigatórios.' }, 200)

      const { data: created, error } = await adminClient.auth.admin.createUser({
        email, password, user_metadata: { name }, email_confirm: true,
      })
      if (error) return json({ error: error.message }, 200)

      const { error: profileError } = await adminClient
        .from('profiles')
        .update({ role, associate_id: role === 'associate' ? (associate_id ?? null) : null })
        .eq('id', created.user.id)
      if (profileError) return json({ error: profileError.message }, 200)

      return json({ ok: true })
    }

    if (body.action === 'delete') {
      const { id } = body
      if (!id) return json({ error: 'ID obrigatório.' }, 200)
      const { error } = await adminClient.auth.admin.deleteUser(id)
      if (error) return json({ error: error.message }, 200)
      return json({ ok: true })
    }

    return json({ error: 'Ação inválida.' }, 200)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado.' }, 200)
  }
})
