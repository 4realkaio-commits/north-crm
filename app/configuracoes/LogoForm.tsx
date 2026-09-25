'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateOrganizationLogo } from './logo-action'

type LogoFormProps = {
  organizationId: string
  currentLogoPath: string
}

export default function LogoForm({
  organizationId,
  currentLogoPath,
}: LogoFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    setMessage('')
    setError('')

    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem válida.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5 MB.')
      event.target.value = ''
      return
    }

    setLoading(true)

    const supabase = createClient()

    const extension =
      file.name.split('.').pop()?.toLowerCase() || 'png'

    const filePath = `${organizationId}/logo-${Date.now()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('organization-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      setLoading(false)
      setError(uploadError.message)
      event.target.value = ''
      return
    }

    const result = await updateOrganizationLogo(
      organizationId,
      filePath,
      currentLogoPath
    )

    setLoading(false)
    event.target.value = ''

    if (!result.success) {
      await supabase.storage
        .from('organization-assets')
        .remove([filePath])

      setError(
        result.error ||
          'Não foi possível salvar a logo.'
      )

      return
    }

    setMessage('Logo atualizada com sucesso.')

    window.location.reload()
  }

  return (
    <div>
      <label
        htmlFor="organization-logo"
        className="inline-flex cursor-pointer items-center rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        {loading ? 'Enviando...' : 'Enviar nova logo'}
      </label>

      <input
        id="organization-logo"
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={loading}
        className="hidden"
      />

      <p className="mt-2 text-xs text-gray-400">
        PNG, JPG, JPEG, WEBP ou outra imagem. Máximo de 5 MB.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}
    </div>
  )
}