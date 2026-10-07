import { prettyStatus } from '../lib/api'

export function StatusBadge({ status }: { status: string }) {
  const tone = status === 'PAID' || status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : status.includes('CANCEL') || status === 'FAILED' || status === 'CHARGEBACK' ? 'bg-red-100 text-red-800' : status === 'PENDING' || status.includes('AWAITING') ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>{prettyStatus(status)}</span>
}
