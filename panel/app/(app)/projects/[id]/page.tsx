import { createClient } from '@/lib/supabase/server'
import { StatusSelect } from './StatusSelect'
import type { Tag } from '@/lib/tags'

export default async function ProjectDetail(
  { params, searchParams }:
  { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string }> }
) {
  const { id } = await params
  const { status } = await searchParams
  const supabase = await createClient()
  let q = supabase.from('tags').select('*').eq('project_id', id)
    .order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  const { data } = await q
  const tags = (data ?? []) as Tag[]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Tags</h1>
      <div className="flex gap-2 text-sm">
        <a href="?" className="underline">all</a>
        <a href="?status=new" className="underline">new</a>
        <a href="?status=in_progress" className="underline">in progress</a>
        <a href="?status=resolved" className="underline">resolved</a>
      </div>
      <table className="w-full text-left">
        <thead><tr className="border-b">
          <th className="p-2">Comment</th><th className="p-2">Page</th>
          <th className="p-2">Status</th></tr></thead>
        <tbody>
          {tags.map((t) => (
            <tr key={t.id} className="border-b align-top">
              <td className="p-2">{t.comment}</td>
              <td className="p-2 text-sm text-gray-500">{t.page_url}</td>
              <td className="p-2"><StatusSelect tagId={t.id} value={t.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
