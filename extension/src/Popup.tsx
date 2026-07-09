import { useEffect, useState } from 'react'
import { getKey, setKey } from './supabase'

export function Popup() {
  const [key, setLocal] = useState('')
  useEffect(() => { getKey().then((k) => k && setLocal(k)) }, [])
  return (
    <div style={{ width: 260, padding: 12, fontFamily: 'sans-serif' }}>
      <h3>QA Tagger</h3>
      <input value={key} onChange={(e) => setLocal(e.target.value)}
             placeholder="Project key" style={{ width: '100%' }} />
      <button onClick={() => setKey(key)} style={{ marginTop: 8 }}>Save</button>
    </div>
  )
}
