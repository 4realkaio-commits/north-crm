import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type EditLeadPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditLeadPage({
  params,
}: EditLeadPageProps) {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .select(`
      id,
      name,
      phone,
      email,
      status,
      potential_value,
      notes,
      last_contact_at,
      next_follow_up_at
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Erro ao carregar o lead
        </h1>

        <pre className="mt-4 overflow-auto text-sm text-red-600">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
        <h1 className="text-lg font-semibold text-yellow-700">
          Lead não encontrado
        </h1>

        <Link
          href="/leads"
          className="mt-4 inline-block text-sm font-medium text-gray-700 underline"
        >
          Voltar para leads
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      {/* Cabeçalho */}
      <header className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href={`/leads/${lead.id}`}
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 transition hover:text-black"
          >
            Lead
          </Link>

          <span className="text-xs text-gray-300">/</span>

          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            Editar
          </span>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-7 bg-black" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-400">
              NORTH CRM
            </span>
          </div>

          <h1 className="text-[34px] font-semibold tracking-[-0.035em] text-gray-950">
            Editar lead
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Atualize as informações e acompanhe a evolução deste lead.
          </p>
        </div>
      </header>

      {/* Formulário */}
      <form
        action={async (formData) => {
          'use server'

          const supabase = await createClient()

          const {
            data: { user },
          } = await supabase.auth.getUser()

          if (!user) {
            redirect('/login')
          }

          const name = String(
            formData.get('name') || ''
          ).trim()

          const phone = String(
            formData.get('phone') || ''
          ).trim()

          const email = String(
            formData.get('email') || ''
          ).trim()

          const status = String(
            formData.get('status') || 'novo'
          ).trim()

          const potentialValueRaw = String(
            formData.get('potential_value') || ''
          ).trim()

          const notes = String(
            formData.get('notes') || ''
          ).trim()

          const lastContactAt = String(
            formData.get('last_contact_at') || ''
          ).trim()

          const nextFollowUpAt = String(
            formData.get('next_follow_up_at') || ''
          ).trim()

          if (!name) {
            return
          }

          const normalizedPotentialValue =
            potentialValueRaw
              ? Number(
                  potentialValueRaw.replace(',', '.')
                )
              : null

          const { error: updateError } =
            await supabase
              .from('leads')
              .update({
                name,
                phone: phone || null,
                email: email || null,
                status,
                potential_value:
                  normalizedPotentialValue,
                notes: notes || null,
                last_contact_at:
                  lastContactAt || null,
                next_follow_up_at:
                  nextFollowUpAt || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', id)
              .is('deleted_at', null)

          if (updateError) {
            console.error(
              'Erro ao atualizar lead:',
              updateError
            )
            return
          }

          redirect(`/leads/${id}`)
        }}
        className="space-y-6"
      >
        {/* Informações principais */}
        <section className="group rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Cadastro
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-tight text-gray-950">
                Informações do lead
              </h2>
            </div>

            <span className="h-1.5 w-1.5 rounded-full bg-gray-200 transition-all duration-300 group-hover:scale-125 group-hover:bg-black" />
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Nome */}
            <div>
              <label
                htmlFor="name"
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
              >
                Nome
              </label>

              <input
                id="name"
                name="name"
                type="text"
                defaultValue={lead.name}
                required
                className="mt-2 w-full border-b border-gray-300 bg-transparent px-1 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
              />
            </div>

            {/* Telefone */}
            <div>
              <label
                htmlFor="phone"
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
              >
                Telefone
              </label>

              <input
                id="phone"
                name="phone"
                type="text"
                defaultValue={lead.phone || ''}
                className="mt-2 w-full border-b border-gray-300 bg-transparent px-1 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
              />
            </div>

            {/* E-mail */}
            <div>
              <label
                htmlFor="email"
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
              >
                E-mail
              </label>

              <input
                id="email"
                name="email"
                type="email"
                defaultValue={lead.email || ''}
                className="mt-2 w-full border-b border-gray-300 bg-transparent px-1 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
              />
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue={lead.status}
                className="mt-2 w-full border-b border-gray-300 bg-transparent px-1 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
              >
                <option value="novo">Novo</option>
                <option value="em_andamento">
                  Em andamento
                </option>
                <option value="convertido">
                  Convertido
                </option>
                <option value="perdido">
                  Perdido
                </option>
              </select>
            </div>

            {/* Valor potencial */}
            <div>
              <label
                htmlFor="potential_value"
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
              >
                Valor potencial
              </label>

              <div className="mt-2 flex items-center border-b border-gray-300 transition focus-within:border-black">
                <span className="px-1 text-sm text-gray-500">
                  R$
                </span>

                <input
                  id="potential_value"
                  name="potential_value"
                  type="text"
                  inputMode="decimal"
                  defaultValue={
                    lead.potential_value !== null
                      ? String(lead.potential_value)
                      : ''
                  }
                  placeholder="0,00"
                  className="w-full bg-transparent px-2 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-300"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Datas */}
        <section className="group rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Acompanhamento
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-tight text-gray-950">
                Contato e follow-up
              </h2>
            </div>

            <span className="h-1.5 w-1.5 rounded-full bg-gray-200 transition-all duration-300 group-hover:scale-125 group-hover:bg-black" />
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="last_contact_at"
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
              >
                Último contato
              </label>

              <input
                id="last_contact_at"
                name="last_contact_at"
                type="datetime-local"
                defaultValue={
                  lead.last_contact_at
                    ? new Date(lead.last_contact_at)
                        .toISOString()
                        .slice(0, 16)
                    : ''
                }
                className="mt-2 w-full border-b border-gray-300 bg-transparent px-1 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="next_follow_up_at"
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
              >
                Próximo follow-up
              </label>

              <input
                id="next_follow_up_at"
                name="next_follow_up_at"
                type="datetime-local"
                defaultValue={
                  lead.next_follow_up_at
                    ? new Date(lead.next_follow_up_at)
                        .toISOString()
                        .slice(0, 16)
                    : ''
                }
                className="mt-2 w-full border-b border-gray-300 bg-transparent px-1 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
              />
            </div>
          </div>
        </section>

        {/* Observações */}
        <section className="group rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Contexto
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-tight text-gray-950">
                Observações
              </h2>
            </div>

            <span className="h-1.5 w-1.5 rounded-full bg-gray-200 transition-all duration-300 group-hover:scale-125 group-hover:bg-black" />
          </div>

          <textarea
            id="notes"
            name="notes"
            defaultValue={lead.notes || ''}
            rows={6}
            placeholder="Adicione informações importantes sobre este lead..."
            className="mt-7 w-full resize-none border border-gray-200 bg-gray-50/50 p-4 text-sm leading-6 text-gray-900 outline-none transition focus:border-black focus:bg-white"
          />
        </section>

        {/* Ações */}
        <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href={`/leads/${lead.id}`}
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-center text-sm font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-black hover:text-black hover:shadow-[0_6px_16px_rgba(0,0,0,0.05)]"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:translate-y-0"
          >
            Salvar alterações
          </button>
        </div>
      </form>
    </div>
  )
}