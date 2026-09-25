export default function MetricCard({
  title,
  value,
  description,
}: {
  title: string
  value: number | string
  description: string
}) {
  return (
    <div className="group border border-gray-200 bg-white px-6 py-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
          {title}
        </p>

        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-200 transition-all duration-300 group-hover:scale-125 group-hover:bg-black" />
      </div>

      <div className="mt-7">
        <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
          {value}
        </p>

        <div className="mt-5 h-px w-full bg-gray-100" />

        <p className="mt-4 text-xs text-gray-400">
          {description}
        </p>
      </div>
    </div>
  )
}