import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const stages = [
  {
    name: 'Novo',
    position: 1,
    color: '#6B7280',
    is_final: false,
  },
  {
    name: 'Contato',
    position: 2,
    color: '#3B82F6',
    is_final: false,
  },
  {
    name: 'Qualificado',
    position: 3,
    color: '#8B5CF6',
    is_final: false,
  },
  {
    name: 'Proposta',
    position: 4,
    color: '#F59E0B',
    is_final: false,
  },
  {
    name: 'Negociação',
    position: 5,
    color: '#F97316',
    is_final: false,
  },
  {
    name: 'Convertido',
    position: 6,
    color: '#22C55E',
    is_final: true,
  },
  {
    name: 'Perdido',
    position: 7,
    color: '#EF4444',
    is_final: true,
  },
]

export default async function SetupStagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership, error: membershipError } =
    await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

  if (membershipError) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-bold text-red-600">
          Erro ao encontrar organização
        </h1>

        <pre className="mt-6 rounded-xl bg-gray-100 p-6 text-sm">
          {JSON.stringify(membershipError, null, 2)}
        </pre>
      </main>
    )
  }

  if (!membership) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-bold text-red-600">
          Nenhuma organização encontrada
        </h1>
      </main>
    )
  }

  const organizationId = membership.organization_id

  const { data: existingStages, error: existingError } =
    await supabase
      .from('pipeline_stages')
      .select('id, name, position, color, is_final')
      .eq('organization_id', organizationId)
      .order('position', { ascending: true })

  if (existingError) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-bold text-red-600">
          Erro ao verificar estágios
        </h1>

        <pre className="mt-6 rounded-xl bg-gray-100 p-6 text-sm">
          {JSON.stringify(existingError, null, 2)}
        </pre>
      </main>
    )
  }

  if (existingStages && existingStages.length > 0) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-bold text-green-600">
          Estágios já existem
        </h1>

        <pre className="mt-6 rounded-xl bg-gray-100 p-6 text-sm">
          {JSON.stringify(existingStages, null, 2)}
        </pre>
      </main>
    )
  }

  const { data, error } = await supabase
    .from('pipeline_stages')
    .insert(
      stages.map((stage) => ({
        organization_id: organizationId,
        ...stage,
      }))
    )
    .select('id, name, position, color, is_final')

  if (error) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-bold text-red-600">
          Erro ao criar estágios
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
        Estágios criados!
      </h1>

      <pre className="mt-6 rounded-xl bg-gray-100 p-6 text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  )
}