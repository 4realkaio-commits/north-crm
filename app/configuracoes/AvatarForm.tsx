'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateProfileAvatar } from './avatar-action'

type AvatarFormProps = {
  userId: string
  currentAvatarPath: string
}

export default function AvatarForm({
  userId,
  currentAvatarPath,
}: AvatarFormProps) {
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

    const filePath = `${userId}/avatar-${Date.now()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
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

    const result = await updateProfileAvatar(
      userId,
      filePath,
      currentAvatarPath
    )

    setLoading(false)
    event.target.value = ''

    if (!result.success) {
      await supabase.storage
        .from('user-avatars')
        .remove([filePath])

      setError(
        result.error ||
          'Não foi possível salvar o avatar.'
      )

      return
    }

    setMessage('Avatar atualizado com sucesso.')

    window.location.reload()
  }

  return (
    <div>
      <label
        htmlFor="user-avatar"
        className="inline-flex cursor-pointer items-center rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        {loading ? 'Enviando...' : 'Enviar novo avatar'}
      </label>

      <input
        id="user-avatar"
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