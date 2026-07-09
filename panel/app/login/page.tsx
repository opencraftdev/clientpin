import { signIn } from './actions'

export default function Login() {
  return (
    <form action={signIn} className="max-w-sm mx-auto mt-24 flex flex-col gap-3">
      <h1 className="text-xl font-semibold">QA Panel — Sign in</h1>
      <input name="email" type="email" placeholder="Email" required className="border p-2 rounded" />
      <input name="password" type="password" placeholder="Password" required className="border p-2 rounded" />
      <button className="bg-black text-white p-2 rounded">Sign in</button>
    </form>
  )
}
