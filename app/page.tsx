import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1)

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold">NORTH CRM</h1>

      <pre className="mt-6">
        {JSON.stringify({ data, error }, null, 2)}
      </pre>
    </main>
  )
}