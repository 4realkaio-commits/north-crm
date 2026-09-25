import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f6f6f6] text-gray-900">
      <Sidebar />

      <main className="min-h-screen pl-[272px]">
        <Topbar />

        <div className="min-h-screen px-8 py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}