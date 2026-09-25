'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewLeadForm() {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [instagram, setInstagram] = useState('')
  const [city, setCity] = useState('')
  const [segment, setSegment] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [potentialValue, setPotentialValue] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleOpen() {
    setError('')
    setOpen(true)
  }

  function handleClose() {
    if (loading) return

    setOpen(false)
    setError('')
  }

  function resetForm() {
    setName('')
    setCompanyName('')
    setInstagram('')
    setCity('')
    setSegment('')
    setPhone('')
    setEmail('')
    setPotentialValue('')
    setNotes('')
    setError('')
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Informe o nome do lead.')
      return
    }

    setLoading(true)

    const supabase = createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError(
        userError?.message ||
          'Usuário não autenticado.'
      )
      setLoading(false)
      return
    }

    const {
      data: membership,
      error: membershipError,
    } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (membershipError) {
      console.error(
        'Erro ao buscar organização:',
        JSON.stringify(
          membershipError,
          null,
          2
        )
      )

      setError(
        membershipError.message ||
          'Não foi possível identificar a organização.'
      )

      setLoading(false)
      return
    }

    if (!membership?.organization_id) {
      setError(
        'Usuário não está vinculado a uma organização.'
      )

      setLoading(false)
      return
    }

    const organizationId =
      membership.organization_id

    const {
      data: firstStage,
      error: stageError,
    } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq(
        'organization_id',
        organizationId
      )
      .order('position', {
        ascending: true,
      })
      .limit(1)
      .maybeSingle()

    if (stageError) {
      console.error(
        'Erro ao buscar primeira etapa:',
        JSON.stringify(
          stageError,
          null,
          2
        )
      )

      setError(
        stageError.message ||
          'Não foi possível identificar a etapa inicial.'
      )

      setLoading(false)
      return
    }

    if (!firstStage?.id) {
      setError(
        'Nenhuma etapa foi cadastrada no funil.'
      )

      setLoading(false)
      return
    }

    const parsedPotentialValue =
      potentialValue.trim()
        ? Number(
            potentialValue
              .replace(/\./g, '')
              .replace(',', '.')
          )
        : 0

    if (
      !Number.isFinite(
        parsedPotentialValue
      ) ||
      parsedPotentialValue < 0
    ) {
      setError(
        'Informe um valor potencial válido.'
      )

      setLoading(false)
      return
    }

    const { error: insertError } =
      await supabase
        .from('leads')
        .insert({
          organization_id:
            organizationId,

          name:
            name.trim(),

          company_name:
            companyName.trim() || null,

          instagram:
            instagram.trim() || null,

          city:
            city.trim() || null,

          segment:
            segment.trim() || null,

          phone:
            phone.trim() || null,

          email:
            email.trim() || null,

          potential_value:
            parsedPotentialValue,

          notes:
            notes.trim() || null,

          status:
            'novo',

          stage_id:
            firstStage.id,

          responsible_id:
            user.id,
        })

    if (insertError) {
      console.error(
        'Erro ao criar lead:',
        JSON.stringify(
          insertError,
          null,
          2
        )
      )

      setError(
        insertError.message ||
          'Não foi possível criar o lead.'
      )

      setLoading(false)
      return
    }

    setLoading(false)
    setOpen(false)
    resetForm()
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:translate-y-0"
      >
        Novo lead
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-7 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Prospecção
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-gray-950">
                  Novo lead
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Cadastre um novo prospect na operação comercial.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="text-xl leading-none text-gray-300 transition hover:text-black disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8"
            >
              <div>
                <label
                  htmlFor="lead-name"
                  className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
                >
                  Nome
                </label>

                <input
                  id="lead-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="Nome do lead"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-black disabled:opacity-50"
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="lead-company"
                  className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
                >
                  Empresa
                </label>

                <input
                  id="lead-company"
                  type="text"
                  value={companyName}
                  onChange={(event) =>
                    setCompanyName(
                      event.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="Nome da empresa"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-black disabled:opacity-50"
                />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="lead-instagram"
                    className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
                  >
                    Instagram
                  </label>

                  <input
                    id="lead-instagram"
                    type="text"
                    value={instagram}
                    onChange={(event) =>
                      setInstagram(
                        event.target.value
                      )
                    }
                    disabled={loading}
                    placeholder="@empresa"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-black disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lead-city"
                    className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
                  >
                    Cidade
                  </label>

                  <input
                    id="lead-city"
                    type="text"
                    value={city}
                    onChange={(event) =>
                      setCity(
                        event.target.value
                      )
                    }
                    disabled={loading}
                    placeholder="Santos - SP"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-black disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="lead-segment"
                  className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
                >
                  Segmento
                </label>

                <input
                  id="lead-segment"
                  type="text"
                  value={segment}
                  onChange={(event) =>
                    setSegment(
                      event.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="Clínica, restaurante, advogado..."
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-black disabled:opacity-50"
                />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="lead-phone"
                    className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
                  >
                    Telefone
                  </label>

                  <input
                    id="lead-phone"
                    type="text"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value
                      )
                    }
                    disabled={loading}
                    placeholder="(13) 99999-9999"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-black disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lead-email"
                    className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
                  >
                    E-mail
                  </label>

                  <input
                    id="lead-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    disabled={loading}
                    placeholder="email@exemplo.com"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-black disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="lead-potential-value"
                  className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
                >
                  Valor potencial
                </label>

                <input
                  id="lead-potential-value"
                  type="text"
                  inputMode="decimal"
                  value={potentialValue}
                  onChange={(event) =>
                    setPotentialValue(
                      event.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="R$ 0,00"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-black disabled:opacity-50"
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="lead-notes"
                  className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
                >
                  Observações
                </label>

                <textarea
                  id="lead-notes"
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value
                    )
                  }
                  disabled={loading}
                  rows={4}
                  placeholder="Observações sobre o lead..."
                  className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-black disabled:opacity-50"
                />
              </div>

              {error && (
                <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-xs font-medium text-red-600">
                    {error}
                  </p>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-black disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !name.trim()
                  }
                  className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? 'Salvando...'
                    : 'Criar lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}