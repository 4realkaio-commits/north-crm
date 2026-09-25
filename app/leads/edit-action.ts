'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type UpdateLeadInput = {
  id: string
  name: string
  phone?: string
  email?: string
  status?: string
  potentialValue?: string
  notes?: string
}

type UpdateLeadResult = {
  success: boolean
  error?: string
}

export async function updateLead(
  input: UpdateLeadInput
): Promise<UpdateLeadResult> {
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

  const name = input.name.trim()

  if (!name) {
    return {
      success: false,
      error: 'Informe o nome do lead.',
    }
  }

  const potentialValue = input.potentialValue?.trim()
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

  const { data, error } = await supabase
    .from('leads')
    .update({
      name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      status: input.status || 'novo',
      potential_value: potentialValue,
      notes: input.notes?.trim() || null,
    })
    .eq('id', input.id)
    .select('id')
    .maybeSingle()

  if (error) {
    return {
      success: false,
      error: `Erro ao atualizar lead: ${error.message}`,
    }
  }

  if (!data) {
    return {
      success: false,
      error:
        'Nenhum lead foi atualizado. Verifique as permissões do Supabase.',
    }
  }

  revalidatePath('/leads')
  revalidatePath(`/leads/${input.id}`)
  revalidatePath(`/leads/${input.id}/editar`)

  return {
    success: true,
  }
}