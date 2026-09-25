'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type ChartData = {
  name: string
  leads: number
  conversions: number
}

type IndicatorsChartProps = {
  data: ChartData[]
}

export default function IndicatorsChart({
  data,
}: IndicatorsChartProps) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Evolução comercial
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Leads e conversões dos últimos 30 dias.
        </p>
      </div>

      <div className="mb-4 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-black" />
          <span className="text-gray-600">
            Leads
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
          <span className="text-gray-600">
            Conversões
          </span>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <YAxis allowDecimals={false} />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="leads"
              stroke="currentColor"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="conversions"
              stroke="gray"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}