import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createProject } from './actions'

export default async function Projects() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects').select('id, name, site_url, project_key')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <form action={createProject} className="flex gap-2">
        <input name="name" placeholder="Name" required className="border p-2 rounded" />
        <input name="site_url" placeholder="https://site.com" required className="border p-2 rounded" />
        <button className="bg-black text-white px-4 rounded">Add</button>
      </form>
      <ul className="flex flex-col gap-2">
        {projects?.map((p) => (
          <li key={p.id} className="border p-3 rounded flex justify-between">
            <div>
              <Link href={`/projects/${p.id}`} className="font-medium underline">{p.name}</Link>
              <span className="block text-sm text-gray-500">{p.site_url}</span>
            </div>
            <code className="text-sm text-gray-500">key: {p.project_key}</code>
          </li>
        ))}
      </ul>
      {!projects?.length && <p className="text-gray-500">No projects yet.</p>}
    </div>
  )
}
