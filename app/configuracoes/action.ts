'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type UpdateOrganizationResult = {
  success: boolean
  error?: string
}

export async function updateOrganization(
  organizationId: string,
  data: {
    name: string
    email: string
    phone: string
    timezone: string
  }
): Promise<UpdateOrganizationResult> {
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

  if (!organizationId) {
    return {
      success: false,
      error: 'Organização inválida.',
    }
  }

  if (!data.name.trim()) {
    return {
      success: false,
      error: 'O nome da organização é obrigatório.',
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
      error: 'Você não tem permissão para editar a organização.',
    }
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      name: data.name.trim(),
      email: data.email.trim() || null,
      phone: data.phone.trim() || null,
      timezone: data.timezone,
    })
    .eq('id', organizationId)

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  revalidatePath('/configuracoes')
  revalidatePath('/')

  return {
    success: true,
  }
}