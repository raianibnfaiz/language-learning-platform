import { Link } from 'react-router-dom'

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 text-lg font-black text-white shadow-lg shadow-primary-600/30">
        L
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
        Lingua<span className="text-primary-600">Wealth</span>
      </span>
    </Link>
  )
}
