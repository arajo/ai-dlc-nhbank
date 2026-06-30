import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import koKR from 'antd/locale/ko_KR'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'

// Customer pages
import CustomerLoginPage from './pages/customer/LoginPage'
import MenuPage from './pages/customer/MenuPage'
import OrderHistoryPage from './pages/customer/OrderHistoryPage'

// Admin pages
import AdminLoginPage from './pages/admin/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import MenuManagePage from './pages/admin/MenuManagePage'
import TableDetailPage from './pages/admin/TableDetailPage'

function App() {
    return (
        <ConfigProvider locale={koKR}>
            <BrowserRouter>
                <AuthProvider>
                    <CartProvider>
                        <Routes>
                            {/* Customer routes */}
                            <Route path="/customer/login" element={<CustomerLoginPage />} />
                            <Route path="/customer/menu" element={<MenuPage />} />
                            <Route path="/customer/orders" element={<OrderHistoryPage />} />
                            <Route path="/customer" element={<Navigate to="/customer/menu" replace />} />

                            {/* Admin routes */}
                            <Route path="/admin/login" element={<AdminLoginPage />} />
                            <Route path="/admin/dashboard" element={<DashboardPage />} />
                            <Route path="/admin/menus" element={<MenuManagePage />} />
                            <Route path="/admin/tables/:tableId" element={<TableDetailPage />} />
                            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

                            {/* Default */}
                            <Route path="/" element={<Navigate to="/customer/menu" replace />} />
                        </Routes>
                    </CartProvider>
                </AuthProvider>
            </BrowserRouter>
        </ConfigProvider>
    )
}

export default App
