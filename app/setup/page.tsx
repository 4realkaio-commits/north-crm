import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function SetupPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: organizations, error: organizationsError } =
    await supabase
      .from('organization_members')
      .select(`
        organization_id,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', user.id)

  if (organizationsError) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-bold">
          Erro
        </h1>

        <pre className="mt-4 text-sm">
          {JSON.stringify(organizationsError, null, 2)}
        </pre>
      </main>
    )
  }

  if (organizations && organizations.length > 0) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-bold">
          Organização encontrada
        </h1>

        <pre className="mt-6 rounded-xl bg-gray-100 p-6 text-sm">
          {JSON.stringify(organizations, null, 2)}
        </pre>
      </main>
    )
  }

  const { data, error } = await supabase.rpc(
    'create_organization',
    {
      p_name: 'NORTH CRM',
      p_slug: `north-crm-${user.id.slice(0, 8)}`,
    }
  )

  if (error) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-bold text-red-600">
          Erro ao criar organização
        </h1>

        <pre className="mt-6 rounded-xl bg-gray-100 p-6 text-sm">
          {JSON.stringify(error, null, 2)}
        </pre>
      </main>
    )
  }

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold text-green-600">
        Organização criada!
      </h1>

      <pre className="mt-6 rounded-xl bg-gray-100 p-6 text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  )
}