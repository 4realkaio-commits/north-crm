import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ConvitePageProps = {
  params: Promise<{
    token: string
  }>
}

export default async function ConvitePage({
  params,
}: ConvitePageProps) {
  const { token } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Convite inválido
        </h1>

        <p className="mt-2 text-sm text-red-600">
          O convite não possui um token válido.
        </p>
      </div>
    )
  }

  const { data: organizationId, error } =
    await supabase.rpc('accept_invitation', {
      p_token: token,
    })

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Não foi possível aceitar o convite
        </h1>

        <p className="mt-2 text-sm text-red-600">
          {error.message}
        </p>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Convite inválido
        </h1>

        <p className="mt-2 text-sm text-red-600">
          Não foi possível identificar a organização do convite.
        </p>
      </div>
    )
  }

  redirect('/equipe')
}