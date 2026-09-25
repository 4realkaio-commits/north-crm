'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function deleteScript(scriptId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: 'Usuário não autenticado.',
    }
  }

  if (!scriptId) {
    return {
      success: false,
      error: 'Script não informado.',
    }
  }

  const { data: membership, error: membershipError } =
    await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

  if (membershipError || !membership) {
    return {
      success: false,
      error: 'Organização do usuário não encontrada.',
    }
  }

  const { error } = await supabase
    .from('scripts')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', scriptId)
    .eq('organization_id', membership.organization_id)
    .is('deleted_at', null)

  if (error) {
    return {
      success: false,
      error: `Erro ao excluir script: ${error.message}`,
    }
  }

  revalidatePath('/scripts')
  revalidatePath(`/scripts/${scriptId}`)
  revalidatePath(`/scripts/${scriptId}/editar`)

  return {
    success: true,
  }
}
