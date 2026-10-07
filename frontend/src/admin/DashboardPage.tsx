import { Banknote, ChefHat, ClipboardCheck, PackageSearch } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ErrorPanel, LoadingPanel } from '../components/StatePanel'
import { prettyStatus, api, errorMessage, money } from '../lib/api'
import type { FulfillmentStatus } from '../types'

type Dashboard = { totalOrders: number; ordersToday: number; paidSales: number; paidSalesToday: number; lowStockProducts: number; statusCounts: { status: FulfillmentStatus; count: number }[] }
export function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null); const [error, setError] = useState('')
  const load = () => api.get<Dashboard>('/admin/dashboard').then(response => setData(response.data)).catch(reason => setError(errorMessage(reason)))
  useEffect(() => { void load() }, [])
  if (!data && !error) return <LoadingPanel label="Calculating today's service..." />
  if (error || !data) return <ErrorPanel message={error} retry={load} />
  const cards = [{ label: 'Orders today', value: data.ordersToday, note: `${data.totalOrders} all time`, icon: ClipboardCheck, tone: 'bg-blue-100 text-blue-700' }, { label: 'Paid sales today', value: money(data.paidSalesToday), note: `${money(data.paidSales)} all time`, icon: Banknote, tone: 'bg-emerald-100 text-emerald-700' }, { label: 'Active kitchen queue', value: data.statusCounts.filter(row => ['CONFIRMED', 'PREPARING', 'READY'].includes(row.status)).reduce((sum, row) => sum + row.count, 0), note: 'Confirmed to ready', icon: ChefHat, tone: 'bg-orange-100 text-orange-700' }, { label: 'Low stock items', value: data.lowStockProducts, note: 'Five or fewer remaining', icon: PackageSearch, tone: 'bg-red-100 text-red-700' }]
  return <><div><p className="text-sm font-bold text-orange-600">Service overview</p><h1 className="mt-1 font-display text-3xl font-bold">Good evening, kitchen team.</h1><p className="mt-2 text-sm text-slate-500">A live summary of orders, verified sales and inventory attention.</p></div><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, note, icon: Icon, tone }) => <article key={label} className="admin-card"><div className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon size={19} /></div><p className="mt-5 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p><p className="mt-2 text-xs text-slate-400">{note}</p></article>)}</div><section className="admin-card mt-6"><div><h2 className="font-display text-xl font-bold">Orders by fulfilment stage</h2><p className="mt-1 text-sm text-slate-500">Payment and fulfilment remain separate by design.</p></div><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{data.statusCounts.map(item => <div key={item.status} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{prettyStatus(item.status)}</p><p className="mt-2 text-2xl font-extrabold">{item.count}</p></div>)}</div></section></>
}
