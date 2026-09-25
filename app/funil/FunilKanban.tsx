'use client'

import type { DragEvent } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Lead = {
  id: string
  name: string
  phone: string | null
  potential_value: number | null
  stage_id: string | null
}

type Stage = {
  id: string
  name: string
  position: number
  color: string | null
  is_final: boolean
}

type FunilKanbanProps = {
  stages: Stage[]
  initialLeads: Lead[]
}

type ConversionModalState = {
  open: boolean
  leadId: string | null
  leadName: string
  stageId: string | null
}

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(Number(value))) {
    return '—'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(Number(value))
}

export default function FunilKanban({
  stages,
  initialLeads,
}: FunilKanbanProps) {
  const router = useRouter()

  const [localLeads, setLocalLeads] = useState<Lead[]>(
    initialLeads ?? []
  )

  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(
    null
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [conversionModal, setConversionModal] =
    useState<ConversionModalState>({
      open: false,
      leadId: null,
      leadName: '',
      stageId: null,
    })

  const [conversionValue, setConversionValue] = useState('')

  const convertedStage = stages.find(
    (stage) => stage.name.trim().toLowerCase() === 'convertido'
  )

  function getStageLeads(stageId: string) {
    return localLeads.filter(
      (lead) => lead.stage_id === stageId
    )
  }

  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    leadId: string
  ) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', leadId)

    setDraggedLeadId(leadId)
    setError('')
  }

  function handleDragEnd() {
    setDraggedLeadId(null)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  async function handleDrop(
    event: DragEvent<HTMLDivElement>,
    targetStageId: string
  ) {
    event.preventDefault()

    const leadId =
      event.dataTransfer.getData('text/plain') ||
      draggedLeadId

    setDraggedLeadId(null)

    if (!leadId) {
      return
    }

    const lead = localLeads.find(
      (item) => item.id === leadId
    )

    if (!lead) {
      return
    }

    if (lead.stage_id === targetStageId) {
      return
    }

    if (
      convertedStage &&
      targetStageId === convertedStage.id
    ) {
      setConversionModal({
        open: true,
        leadId: lead.id,
        leadName: lead.name,
        stageId: targetStageId,
      })

      setConversionValue('')
      setError('')

      return
    }

    await moveLead(leadId, targetStageId)
  }

  async function moveLead(
    leadId: string,
    targetStageId: string
  ) {
    setLoading(true)
    setError('')

    const supabase = createClient()

    const previousLeads = [...localLeads]

    setLocalLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              stage_id: targetStageId,
            }
          : lead
      )
    )

    const { error: rpcError } = await supabase.rpc(
      'change_lead_stage',
      {
        p_lead_id: leadId,
        p_stage_id: targetStageId,
      }
    )

    if (rpcError) {
      console.error(
        'Erro ao mover lead:',
        rpcError
      )

      setLocalLeads(previousLeads)
      setError(
        `Erro ao mover lead: ${rpcError.message}`
      )
      setLoading(false)

      return
    }

    setLoading(false)
    router.refresh()
  }

  function closeConversionModal() {
    if (loading) {
      return
    }

    setConversionModal({
      open: false,
      leadId: null,
      leadName: '',
      stageId: null,
    })

    setConversionValue('')
    setError('')
  }

  async function handleConversion() {
    if (!conversionModal.leadId) {
      return
    }

    const normalizedValue = conversionValue
      .trim()
      .replace(/\./g, '')
      .replace(',', '.')

    const parsedValue = Number(normalizedValue)

    if (
      normalizedValue === '' ||
      !Number.isFinite(parsedValue) ||
      parsedValue < 0
    ) {
      setError(
        'Informe um valor de conversão válido.'
      )

      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error: rpcError } = await supabase.rpc(
      'convert_lead_to_client',
      {
        p_lead_id: conversionModal.leadId,
        p_converted_value: parsedValue,
      }
    )

    if (rpcError) {
      console.error(
        'Erro ao converter lead:',
        rpcError
      )

      setError(
        `Erro ao converter lead: ${rpcError.message}`
      )

      setLoading(false)

      return
    }

    setLocalLeads((current) =>
      current.map((lead) =>
        lead.id === conversionModal.leadId
          ? {
              ...lead,
              stage_id:
                conversionModal.stageId ??
                lead.stage_id,
            }
          : lead
      )
    )

    setLoading(false)

    setConversionModal({
      open: false,
      leadId: null,
      leadName: '',
      stageId: null,
    })

    setConversionValue('')
    setError('')

    router.refresh()
  }

  return (
    <div className="relative">
      {error && (
        <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      {loading && (
        <div className="mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black" />

          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-400">
            Atualizando
          </span>
        </div>
      )}

      <div className="overflow-x-auto pb-3">
        <div className="grid min-w-[1400px] grid-cols-7 border-l border-t border-gray-200">
          {stages.map((stage, index) => {
            const stageLeads = getStageLeads(stage.id)

            const stageValue = stageLeads.reduce(
              (total, lead) =>
                total +
                Number(lead.potential_value || 0),
              0
            )

            return (
              <div
                key={stage.id}
                className="border-r border-gray-200"
                onDragOver={handleDragOver}
                onDrop={(event) =>
                  handleDrop(event, stage.id)
                }
              >
                <div className="relative border-b border-gray-200 bg-white px-4 py-4">
                  <div
                    className="absolute left-0 top-0 h-[2px] w-full"
                    style={{
                      backgroundColor:
                        stage.color || '#111111',
                    }}
                  />

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-[9px] font-medium text-gray-300">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <h3 className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-gray-700">
                        {stage.name}
                      </h3>
                    </div>

                    <span className="flex h-5 min-w-5 items-center justify-center border border-gray-200 px-1.5 text-[9px] font-semibold text-gray-500">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-[8px] uppercase tracking-[0.12em] text-gray-400">
                      Potencial
                    </span>

                    <span className="text-[9px] font-medium text-gray-500">
                      {formatCurrency(stageValue)}
                    </span>
                  </div>
                </div>

                <div
                  className={`min-h-[460px] bg-[#f8f8f8] p-2.5 ${
                    draggedLeadId
                      ? 'bg-gray-100'
                      : ''
                  }`}
                >
                  {stageLeads.length === 0 ? (
                    <div className="flex min-h-[130px] items-center justify-center border border-dashed border-gray-200 bg-white/60">
                      <div className="text-center">
                        <span className="mx-auto mb-2 block h-1 w-1 bg-gray-300" />

                        <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-gray-300">
                          Vazio
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stageLeads.map((lead) => {
                        const initials = lead.name
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) =>
                            part
                              .charAt(0)
                              .toUpperCase()
                          )
                          .join('')

                        return (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={(event) =>
                              handleDragStart(
                                event,
                                lead.id
                              )
                            }
                            onDragEnd={handleDragEnd}
                            className={`group cursor-grab border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-[0_8px_18px_rgba(0,0,0,0.05)] active:cursor-grabbing ${
                              draggedLeadId === lead.id
                                ? 'scale-[0.98] opacity-40'
                                : ''
                            }`}
                          >
                            <div className="border-b border-gray-100 px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-gray-200 bg-gray-50 text-[9px] font-bold text-gray-500">
                                  {initials || 'L'}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[12px] font-semibold tracking-[-0.01em] text-gray-900">
                                    {lead.name}
                                  </p>

                                  {lead.phone && (
                                    <p className="mt-0.5 truncate text-[9px] text-gray-400">
                                      {lead.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-end justify-between gap-3 px-4 py-3">
                              <div>
                                <p className="text-[8px] font-semibold uppercase tracking-[0.13em] text-gray-300">
                                  Valor
                                </p>

                                <p className="mt-1 text-[11px] font-semibold text-gray-700">
                                  {formatCurrency(
                                    lead.potential_value
                                  )}
                                </p>
                              </div>

                              <span className="text-[8px] uppercase tracking-[0.1em] text-gray-300 transition-colors group-hover:text-gray-500">
                                Mover
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {conversionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-gray-200 bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-7 py-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-px w-5 bg-black" />

                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                      NORTH CRM
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-gray-950">
                    Converter lead
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    {conversionModal.leadName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeConversionModal}
                  disabled={loading}
                  className="flex h-7 w-7 items-center justify-center border border-gray-200 text-lg leading-none text-gray-400 transition hover:border-gray-400 hover:text-black disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="px-7 py-7">
              <label
                htmlFor="conversion-value"
                className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400"
              >
                Valor da conversão
              </label>

              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  R$
                </span>

                <input
                  id="conversion-value"
                  type="text"
                  inputMode="decimal"
                  value={conversionValue}
                  onChange={(event) =>
                    setConversionValue(
                      event.target.value
                    )
                  }
                  placeholder="0,00"
                  disabled={loading}
                  className="w-full border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-black focus:bg-white disabled:bg-gray-100"
                />
              </div>

              {error && (
                <p className="mt-3 text-xs text-red-600">
                  {error}
                </p>
              )}

              <div className="mt-7 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeConversionModal}
                  disabled={loading}
                  className="px-4 py-2.5 text-xs font-medium text-gray-500 transition hover:text-black disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleConversion}
                  disabled={loading}
                  className="bg-black px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? 'Convertendo...'
                    : 'Confirmar conversão'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}