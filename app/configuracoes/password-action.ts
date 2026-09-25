'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ChangePasswordResult = {
  success: boolean
  error?: string
}

export async function changePassword(
  newPassword: string
): Promise<ChangePasswordResult> {
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

  if (!newPassword) {
    return {
      success: false,
      error: 'Digite uma nova senha.',
    }
  }

  if (newPassword.length < 8) {
    return {
      success: false,
      error: 'A nova senha deve ter pelo menos 8 caracteres.',
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  revalidatePath('/configuracoes')

  return {
    success: true,
  }
}