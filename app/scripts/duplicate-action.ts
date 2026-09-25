'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function duplicateScript(scriptId: string) {
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

  const organizationId = membership.organization_id

  const { data: originalScript, error: scriptError } =
    await supabase
      .from('scripts')
      .select('name, content, variables')
      .eq('id', scriptId)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .maybeSingle()

  if (scriptError) {
    return {
      success: false,
      error: `Erro ao buscar script: ${scriptError.message}`,
    }
  }

  if (!originalScript) {
    return {
      success: false,
      error: 'Script não encontrado.',
    }
  }

  const variables = Array.isArray(originalScript.variables)
    ? originalScript.variables
    : []

  const { data: duplicatedScript, error: duplicateError } =
    await supabase
      .from('scripts')
      .insert({
        organization_id: organizationId,
        name: `${originalScript.name} — cópia`,
        content: originalScript.content,
        variables,
      })
      .select('id')
      .single()

  if (duplicateError || !duplicatedScript) {
    return {
      success: false,
      error:
        duplicateError?.message ||
        'Não foi possível duplicar o script.',
    }
  }

  revalidatePath('/scripts')
  revalidatePath(`/scripts/${scriptId}`)

  return {
    success: true,
    scriptId: duplicatedScript.id,
  }
}