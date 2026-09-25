'use client'

type LeadsChartProps = {
  data?: {
    date: string
    leads: number
  }[]
}

export default function LeadsChart({
  data = [],
}: LeadsChartProps) {
  const total = data.reduce(
    (sum, item) => sum + item.leads,
    0
  )

  const max = Math.max(
    ...data.map((item) => item.leads),
    1
  )

  return (
    <div className="w-full p-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            Novos leads
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
            {total}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Últimos 30 dias
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400">
            Pico diário
          </p>

          <p className="mt-1 text-lg font-semibold text-gray-950">
            {max}
          </p>
        </div>
      </div>

      <div className="flex h-[240px] items-end gap-1 border-b border-gray-200">
        {data.map((item, index) => {
          const height =
            item.leads === 0
              ? 2
              : Math.max(
                  (item.leads / max) * 100,
                  5
                )

          return (
            <div
              key={`${item.date}-${index}`}
              className="group relative flex h-full flex-1 items-end"
            >
              <div
                className="w-full rounded-t-sm bg-black transition-all duration-200 group-hover:bg-gray-700"
                style={{
                  height: `${height}%`,
                  minHeight: '2px',
                }}
              />

              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-black px-3 py-2 text-[10px] font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                Dia {item.date}: {item.leads}{' '}
                {item.leads === 1
                  ? 'lead'
                  : 'leads'}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex justify-between text-[10px] text-gray-400">
        <span>
          {data[0]?.date ?? '—'}
        </span>

        <span>
          {data[
            data.length - 1
          ]?.date ?? '—'}
        </span>
      </div>
    </div>
  )
}