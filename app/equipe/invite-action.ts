'use server'

import { createHash } from 'crypto'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

type InviteMemberInput = {
  email: string
  role: 'member' | 'manager' | 'admin'
}

type InviteMemberResult = {
  success: boolean
  error?: string
}

const roleLabels: Record<
  InviteMemberInput['role'],
  string
> = {
  member: 'Membro',
  manager: 'Gerente',
  admin: 'Administrador',
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

  const { data: membership, error: membershipError } =
    await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

  if (membershipError || !membership) {
    return {
      success: false,
      error: 'Organização do usuário não encontrada.',
    }
  }

  if (
    membership.role !== 'owner' &&
    membership.role !== 'admin'
  ) {
    return {
      success: false,
      error:
        'Apenas proprietários e administradores podem enviar convites.',
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
      .gt('expires_at', new Date().toISOString())
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

  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error: insertError } = await supabase
    .from('invitations')
    .insert({
      organization_id: membership.organization_id,
      email,
      role: input.role,
      invited_by: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    })

  if (insertError) {
    return {
      success: false,
      error: `Erro ao criar convite: ${insertError.message}`,
    }
  }

  const resendApiKey =
    process.env.RESEND_API_KEY

  if (!resendApiKey) {
    return {
      success: false,
      error:
        'RESEND_API_KEY não configurada no servidor.',
    }
  }

  const resend = new Resend(resendApiKey)

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'

  const inviteUrl =
    `${appUrl}/convite/${token}`

  const { error: emailError } =
    await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        'NORTH CRM <onboarding@resend.dev>',
      to: email,
      subject: 'Você foi convidado para o NORTH CRM',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #111827;">
          <h1 style="font-size: 28px; margin-bottom: 8px;">
            NORTH CRM
          </h1>

          <p style="font-size: 16px; color: #4b5563;">
            Você recebeu um convite para participar de uma organização no NORTH CRM.
          </p>

          <div style="margin: 32px 0;">
            <p style="font-size: 15px; color: #4b5563;">
              Função:
              <strong style="color: #111827;">
                ${roleLabels[input.role]}
              </strong>
            </p>
          </div>

          <a
            href="${inviteUrl}"
            style="
              display: inline-block;
              background: #000000;
              color: #ffffff;
              text-decoration: none;
              padding: 14px 22px;
              border-radius: 10px;
              font-weight: 600;
            "
          >
            Aceitar convite
          </a>

          <p style="margin-top: 32px; font-size: 13px; color: #6b7280;">
            Este convite é válido por 7 dias.
          </p>
        </div>
      `,
    })

  if (emailError) {
    return {
      success: false,
      error: `Convite criado, mas o e-mail não foi enviado: ${emailError.message}`,
    }
  }

  revalidatePath('/equipe')

  return {
    success: true,
  }
}