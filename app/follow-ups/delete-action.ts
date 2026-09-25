'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function deleteFollowUp(
  followUpId: string
) {
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

  if (!followUpId) {
    return {
      success: false,
      error: 'Follow-up não informado.',
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
    .from('follow_ups')
    .delete()
    .eq('id', followUpId)
    .eq('organization_id', membership.organization_id)

  if (error) {
    return {
      success: false,
      error: `Erro ao excluir follow-up: ${error.message}`,
    }
  }

  revalidatePath('/follow-ups')

  return {
    success: true,
  }
}