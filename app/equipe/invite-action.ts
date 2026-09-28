'use server'

import { createHash } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type InviteMemberInput = {
  email: string
  role: 'member' | 'manager' | 'admin'
}

type InviteMemberResult = {
  success: boolean
  inviteUrl?: string
  error?: string
}

export async function inviteMember(
  input: InviteMemberInput
): Promise<InviteMemberResult> {
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

  const email = input.email.trim().toLowerCase()

  if (!email) {
    return {
      success: false,
      error: 'Informe o e-mail.',
    }
  }

  if (!email.includes('@')) {
    return {
      success: false,
      error: 'Informe um e-mail válido.',
    }
  }

  if (
    !['member', 'manager', 'admin'].includes(
      input.role
    )
  ) {
    return {
      success: false,
      error: 'Função inválida.',
    }
  }

  const {
    data: membership,
    error: membershipError,
  } =
    await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

  if (membershipError || !membership) {
    return {
      success: false,
      error:
        'Organização do usuário não encontrada.',
    }
  }

  /*
   * Hierarquia de convites:
   *
   * Owner   → Admin, Manager e Member
   * Admin   → Manager e Member
   * Manager → Member
   * Member  → ninguém
   */

  const allowedRoles: Record<
    string,
    string[]
  > = {
    owner: [
      'admin',
      'manager',
      'member',
    ],
    admin: [
      'manager',
      'member',
    ],
    manager: [
      'member',
    ],
    member: [],
  }

  const allowedInviteRoles =
    allowedRoles[membership.role] || []

  if (
    !allowedInviteRoles.includes(
      input.role
    )
  ) {
    return {
      success: false,
      error:
        'Você não tem permissão para convidar um usuário com essa função.',
    }
  }

  const { data: existingInvitation } =
    await supabase
      .from('invitations')
      .select('id')
      .eq(
        'organization_id',
        membership.organization_id
      )
      .eq('email', email)
      .is('accepted_at', null)
      .gt(
        'expires_at',
        new Date().toISOString()
      )
      .maybeSingle()

  if (existingInvitation) {
    return {
      success: false,
      error:
        'Já existe um convite pendente para este e-mail.',
    }
  }

  const token = crypto.randomUUID()

  const tokenHash = createHash('sha256')
    .update(token, 'utf8')
    .digest('hex')

  const expiresAt = new Date()

  expiresAt.setDate(
    expiresAt.getDate() + 7
  )

  const {
    error: insertError,
  } = await supabase
    .from('invitations')
    .insert({
      organization_id:
        membership.organization_id,
      email,
      role: input.role,
      invited_by: user.id,
      token_hash: tokenHash,
      expires_at:
        expiresAt.toISOString(),
    })

  if (insertError) {
    return {
      success: false,
      error: `Erro ao criar convite: ${insertError.message}`,
    }
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'

  const inviteUrl =
    `${appUrl}/convite/${token}`

  revalidatePath('/equipe')

  return {
    success: true,
    inviteUrl,
  }
}