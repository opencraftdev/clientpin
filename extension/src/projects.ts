export type Project = { name: string; slug: string; project_key: string }

export async function listProjects(): Promise<Project[]> {
  const { projects } = await chrome.storage.local.get('projects')
  return (projects ?? []) as Project[]
}
export async function addProject(p: Project): Promise<void> {
  const projects = await listProjects()
  await chrome.storage.local.set({ projects: [...projects, p], activeSlug: p.slug })
}
export async function getActive(): Promise<Project | null> {
  const { activeSlug } = await chrome.storage.local.get('activeSlug')
  if (!activeSlug) return null
  return (await listProjects()).find((p) => p.slug === activeSlug) ?? null
}
export async function setActive(slug: string): Promise<void> {
  await chrome.storage.local.set({ activeSlug: slug })
}
