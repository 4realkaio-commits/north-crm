'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type CreateFollowUpInput = {
  leadId: string
  scheduledAt: string
  type: string
  note?: string
}

type CreateFollowUpResult = {
  success: boolean
  error?: string
}

export async function createFollowUp(
  input: CreateFollowUpInput
): Promise<CreateFollowUpResult> {
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

  if (!input.leadId) {
    return {
      success: false,
      error: 'Selecione um lead.',
    }
  }

  if (!input.scheduledAt) {
    return {
      success: false,
      error: 'Informe a data e o horário.',
    }
  }

  if (!input.type.trim()) {
    return {
      success: false,
      error: 'Informe o tipo do follow-up.',
    }
  }

  const scheduledAt = new Date(input.scheduledAt)

  if (Number.isNaN(scheduledAt.getTime())) {
    return {
      success: false,
      error: 'A data e o horário informados são inválidos.',
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

  const organizationId = membership.organization_id

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id')
    .eq('id', input.leadId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .maybeSingle()

  if (leadError) {
    return {
      success: false,
      error: `Erro ao validar o lead: ${leadError.message}`,
    }
  }

  if (!lead) {
    return {
      success: false,
      error: 'Lead não encontrado ou não pertence à organização.',
    }
  }

  const { error } = await supabase
    .from('follow_ups')
    .insert({
      organization_id: organizationId,
      lead_id: input.leadId,
      responsible_id: user.id,
      scheduled_at: scheduledAt.toISOString(),
      type: input.type.trim(),
      note: input.note?.trim() || null,
      status: 'pending',
    })

  if (error) {
    return {
      success: false,
      error: `Erro ao criar follow-up: ${error.message}`,
    }
  }

  revalidatePath('/follow-ups')
  revalidatePath(`/leads/${input.leadId}`)

  return {
    success: true,
  }
}