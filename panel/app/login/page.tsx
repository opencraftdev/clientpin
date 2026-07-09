import { signIn } from './actions'

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <form action={signIn} className="max-w-sm mx-auto mt-24 flex flex-col gap-3">
      <h1 className="text-xl font-semibold">QA Panel — Sign in</h1>
      <input name="email" type="email" placeholder="Email" required className="border p-2 rounded" />
      <input name="password" type="password" placeholder="Password" required className="border p-2 rounded" />
      {error && <p className="text-red-600 text-sm">Invalid credentials.</p>}
      <button className="bg-black text-white p-2 rounded">Sign in</button>
    </form>
  )
}
