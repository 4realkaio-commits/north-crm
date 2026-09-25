'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type DeleteLeadResult = {
  success: boolean
  error?: string
}

export async function deleteLead(
  leadId: string
): Promise<DeleteLeadResult> {
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

  if (!leadId) {
    return {
      success: false,
      error: 'Lead inválido.',
    }
  }

  const { data, error } = await supabase
    .from('leads')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle()

  if (error) {
    return {
      success: false,
      error: `Erro ao excluir lead: ${error.message}`,
    }
  }

  if (!data) {
    return {
      success: false,
      error: 'Lead não encontrado ou já foi excluído.',
    }
  }

  revalidatePath('/leads')
  revalidatePath(`/leads/${leadId}`)

  return {
    success: true,
  }
}