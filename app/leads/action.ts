'use server'

import { createClient } from '@/lib/supabase/server'

type CreateLeadInput = {
  name: string
  phone?: string
  email?: string
  potentialValue?: string
  notes?: string
}

type CreateLeadResult = {
  success: boolean
  error?: string
}

export async function createLead(
  input: CreateLeadInput
): Promise<CreateLeadResult> {
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

  const { data: membership, error: membershipError } =
    await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

  if (membershipError) {
    return {
      success: false,
      error: 'Não foi possível encontrar sua organização.',
    }
  }

  if (!membership) {
    return {
      success: false,
      error: 'Usuário não pertence a nenhuma organização.',
    }
  }

  const organizationId = membership.organization_id

  const { data: stage, error: stageError } =
    await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('position', 1)
      .maybeSingle()

  if (stageError) {
    return {
      success: false,
      error: 'Não foi possível encontrar o estágio inicial.',
    }
  }

  if (!stage) {
    return {
      success: false,
      error: 'O estágio inicial "Novo" não foi encontrado.',
    }
  }

  const potentialValue = input.potentialValue
    ? Number(input.potentialValue.replace(',', '.'))
    : null

  if (
    potentialValue !== null &&
    (!Number.isFinite(potentialValue) || potentialValue < 0)
  ) {
    return {
      success: false,
      error: 'O valor potencial informado é inválido.',
    }
  }

  const { error: insertError } = await supabase
    .from('leads')
    .insert({
      organization_id: organizationId,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      stage_id: stage.id,
      status: 'novo',
      potential_value: potentialValue,
      notes: input.notes?.trim() || null,
    })

  if (insertError) {
    return {
      success: false,
      error: insertError.message,
    }
  }

  return {
    success: true,
  }
}