import { useEffect, useState } from 'react'
import './popup.css'
import { createProject } from './supabase'
import { listProjects, addProject, getActive, setActive, type Project } from './projects'

export function Popup() {
  const [projects, setProjects] = useState<Project[]>([])
  const [active, setActiveState] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    listProjects().then(setProjects)
    getActive().then((p) => p && setActiveState(p.slug))
  }, [])

  const onSelect = async (slug: string) => { setActiveState(slug); await setActive(slug) }

  const onCreate = async () => {
    if (!name.trim() || !siteUrl.trim()) return
    setBusy(true)
    try {
      const { slug, project_key } = await createProject(name.trim(), siteUrl.trim())
      const p = { name: name.trim(), slug, project_key }
      await addProject(p)
      setProjects(await listProjects()); setActiveState(slug)
      setCreating(false); setName(''); setSiteUrl('')
    } catch (e) { alert('Could not create project: ' + (e as Error).message) }
    finally { setBusy(false) }
  }

  const openList = () => {
    if (active) chrome.tabs.create({ url: `${import.meta.env.VITE_APP_URL}/${active}` })
  }

  return (
    <div className="qa-popup">
      <header className="qa-head">
        <span className="qa-mark">Q</span>
        <div><div className="qa-title">OpenCraftQA</div><div className="qa-sub">Element tagging</div></div>
      </header>

      {!creating ? (
        <>
          <label className="qa-field">
            <span className="qa-label">Active project</span>
            <select className="qa-input" value={active} onChange={(e) => onSelect(e.target.value)}>
              <option value="" disabled>Choose a project…</option>
              {projects.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
          </label>
          <button className="qa-btn" onClick={openList} disabled={!active}>View list</button>
          <button className="qa-btn qa-btn-ghost" onClick={() => setCreating(true)}>+ New project</button>
        </>
      ) : (
        <>
          <label className="qa-field"><span className="qa-label">Project name</span>
            <input className="qa-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Store" /></label>
          <label className="qa-field"><span className="qa-label">Site URL</span>
            <input className="qa-input" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://acme.store" /></label>
          <button className="qa-btn" onClick={onCreate} disabled={busy}>{busy ? 'Creating…' : 'Create'}</button>
          <button className="qa-btn qa-btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
        </>
      )}
    </div>
  )
}
