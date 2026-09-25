'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type UpdateProfileAvatarResult = {
  success: boolean
  error?: string
}

export async function updateProfileAvatar(
  userId: string,
  avatarPath: string,
  oldAvatarPath: string
): Promise<UpdateProfileAvatarResult> {
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
      error: 'Você não pode alterar o avatar de outro usuário.',
    }
  }

  if (!avatarPath) {
    return {
      success: false,
      error: 'Arquivo de avatar inválido.',
    }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      avatar_url: avatarPath,
    })
    .eq('id', user.id)

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    }
  }

  if (oldAvatarPath && oldAvatarPath !== avatarPath) {
    await supabase.storage
      .from('user-avatars')
      .remove([oldAvatarPath])
  }

  revalidatePath('/configuracoes')
  revalidatePath('/equipe')
  revalidatePath('/')

  return {
    success: true,
  }
}