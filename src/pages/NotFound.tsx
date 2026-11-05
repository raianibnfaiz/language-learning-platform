import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-6xl font-black text-primary-600">404</p>
      <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">This page got lost in translation.</p>
      <Link to="/" className="mt-6 inline-block rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white">Back to dashboard</Link>
    </div>
  )
}
