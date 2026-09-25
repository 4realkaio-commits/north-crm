'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { duplicateScript } from './duplicate-action'

type DuplicateScriptButtonProps = {
  scriptId: string
}

export default function DuplicateScriptButton({
  scriptId,
}: DuplicateScriptButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDuplicate() {
    setLoading(true)

    const result = await duplicateScript(scriptId)

    if (!result.success) {
      alert(
        result.error ||
          'Não foi possível duplicar o script.'
      )
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleDuplicate}
      disabled={loading}
      aria-label="Duplicar script"
      title="Duplicar script"
      className="group flex h-8 w-8 items-center justify-center border border-gray-200 bg-white text-gray-400 transition hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <span className="text-[10px]">...</span>
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform group-hover:scale-95"
        >
          <rect
            x="8"
            y="8"
            width="11"
            height="11"
            stroke="currentColor"
            strokeWidth="1.5"
          />

          <path
            d="M16 8V5C16 4.44772 15.5523 4 15 4H5C4.44772 4 4 4.44772 4 5V15C4 15.5523 4.44772 16 8 16"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </button>
  )
}