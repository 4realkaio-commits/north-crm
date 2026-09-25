'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type RemoveMemberResult = {
  success: boolean
  error?: string
}

export async function removeOrganizationMember(
  organizationId: string,
  userId: string
): Promise<RemoveMemberResult> {
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

  if (!organizationId || !userId) {
    return {
      success: false,
      error: 'Dados inválidos.',
    }
  }

  const { error } = await supabase.rpc(
    'remove_organization_member',
    {
      p_organization_id: organizationId,
      p_user_id: userId,
    }
  )

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  revalidatePath('/equipe')

  return {
    success: true,
  }
}