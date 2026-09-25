'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type UpdateProfileResult = {
  success: boolean
  error?: string
}

export async function updateProfile(
  userId: string,
  fullName: string
): Promise<UpdateProfileResult> {
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

  if (user.id !== userId) {
    return {
      success: false,
      error: 'Você não pode alterar o perfil de outro usuário.',
    }
  }

  if (!fullName.trim()) {
    return {
      success: false,
      error: 'O nome completo é obrigatório.',
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName.trim(),
    })
    .eq('id', user.id)

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  revalidatePath('/configuracoes')
  revalidatePath('/equipe')

  return {
    success: true,
  }
}