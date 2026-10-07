import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { AdminLayout } from './admin/AdminLayout'
import { AdminLoginPage } from './admin/AdminLoginPage'
import { CategoriesPage } from './admin/CategoriesPage'
import { DashboardPage } from './admin/DashboardPage'
import { OrdersPage } from './admin/OrdersPage'
import { ProductsPage } from './admin/ProductsPage'
import { StoreLayout } from './components/StoreLayout'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { HomePage } from './pages/HomePage'
import { MenuPage } from './pages/MenuPage'
import { OrderStatusPage } from './pages/OrderStatusPage'
import { ProductPage } from './pages/ProductPage'

function PayHereReturn() {
  const [params] = useSearchParams(); const reference = params.get('reference'); const token = params.get('token')
  return reference && token ? <Navigate replace to={`/order/${reference}?token=${encodeURIComponent(token)}`} /> : <Navigate replace to="/" />
}
function NotFound() { return <main className="container-shell py-24 text-center"><p className="eyebrow">404</p><h1 className="section-title mt-4">This table is not set.</h1><p className="mt-3 text-forest-900/55">The page you requested does not exist.</p><a href="/" className="btn-primary mt-7">Return home</a></main> }

export default function App() {
  return <Routes>
    <Route element={<StoreLayout />}>
      <Route index element={<HomePage />} />
      <Route path="menu" element={<MenuPage />} />
      <Route path="menu/:id" element={<ProductPage />} />
      <Route path="cart" element={<CartPage />} />
      <Route path="checkout" element={<CheckoutPage />} />
      <Route path="order/return" element={<PayHereReturn />} />
      <Route path="order/:reference" element={<OrderStatusPage />} />
      <Route path="*" element={<NotFound />} />
    </Route>
    <Route path="admin/login" element={<AdminLoginPage />} />
    <Route path="admin" element={<AdminLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="categories" element={<CategoriesPage />} />
    </Route>
  </Routes>
}
