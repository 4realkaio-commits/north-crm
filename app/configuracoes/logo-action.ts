'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type UpdateOrganizationLogoResult = {
  success: boolean
  error?: string
}

export async function updateOrganizationLogo(
  organizationId: string,
  logoPath: string,
  oldLogoPath: string
): Promise<UpdateOrganizationLogoResult> {
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

  if (!organizationId || !logoPath) {
    return {
      success: false,
      error: 'Dados inválidos.',
    }
  }

  const { data: membership, error: membershipError } =
    await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle()

  if (membershipError) {
    return {
      success: false,
      error: membershipError.message,
    }
  }

  if (!membership) {
    return {
      success: false,
      error: 'Você não pertence a esta organização.',
    }
  }

  if (
    membership.role !== 'owner' &&
    membership.role !== 'admin'
  ) {
    return {
      success: false,
      error: 'Você não tem permissão para alterar a logo.',
    }
  }

  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      logo_url: logoPath,
    })
    .eq('id', organizationId)

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    }
  }

  if (oldLogoPath && oldLogoPath !== logoPath) {
    await supabase.storage
      .from('organization-assets')
      .remove([oldLogoPath])
  }

  revalidatePath('/configuracoes')
  revalidatePath('/')
  revalidatePath('/equipe')

  return {
    success: true,
  }
}