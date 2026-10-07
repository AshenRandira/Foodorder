import { AlertTriangle, LoaderCircle, SearchX } from 'lucide-react'

export function LoadingPanel({ label = 'Preparing your experience...' }: { label?: string }) {
  return <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-forest-900/60"><LoaderCircle className="animate-spin text-orange-500" size={30} /><p className="text-sm font-semibold">{label}</p></div>
}
export function EmptyPanel({ title, body }: { title: string; body: string }) {
  return <div className="card flex min-h-64 flex-col items-center justify-center px-6 text-center"><SearchX className="mb-4 text-orange-500" size={38} /><h2 className="font-display text-2xl">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-forest-900/60">{body}</p></div>
}
export function ErrorPanel({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="card flex min-h-64 flex-col items-center justify-center px-6 text-center"><AlertTriangle className="mb-4 text-orange-500" size={38} /><h2 className="font-display text-2xl">We hit a snag</h2><p className="mt-2 max-w-md text-sm leading-6 text-forest-900/60">{message}</p>{retry && <button className="btn-secondary mt-5" onClick={retry}>Try again</button>}</div>
}
