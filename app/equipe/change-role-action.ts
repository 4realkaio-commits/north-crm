'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ChangeRoleResult = {
  success: boolean
  error?: string
}

type AllowedRole =
  | 'member'
  | 'manager'
  | 'admin'

export async function changeOrganizationMemberRole(
  organizationId: string,
  userId: string,
  newRole: AllowedRole
): Promise<ChangeRoleResult> {
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

  if (
    !['member', 'manager', 'admin'].includes(
      newRole
    )
  ) {
    return {
      success: false,
      error: 'Função inválida.',
    }
  }

  const { error } = await supabase.rpc(
    'change_organization_member_role',
    {
      p_organization_id: organizationId,
      p_user_id: userId,
      p_new_role: newRole,
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