import { useState, useEffect } from 'react'
import { List, Card, Tag, Button, Typography, message, Spin, Divider, InputNumber, Space } from 'antd'
import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'

const { Title, Text } = Typography

interface OrderItem {
    menu_name: string
    quantity: number
    unit_price: number
}

interface Order {
    id: number
    order_number: string
    status: string
    total_amount: number
    items: OrderItem[]
    created_at: string
}

const statusColors: Record<string, string> = {
    pending: 'orange',
    preparing: 'blue',
    completed: 'green',
}

const statusLabels: Record<string, string> = {
    pending: '대기중',
    preparing: '준비중',
    completed: '완료',
}

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [orderLoading, setOrderLoading] = useState(false)
    const { state: authState } = useAuth()
    const { state: cartState, dispatch: cartDispatch } = useCart()
    const navigate = useNavigate()

    useEffect(() => {
        if (!authState.isAuthenticated || !authState.tableId) {
            navigate('/customer/login')
            return
        }
        loadOrders()
    }, [])

    const loadOrders = async () => {
        try {
            // Get current session from table info (session_id from localStorage or first order)
            const sessionId = localStorage.getItem('sessionId')
            if (sessionId) {
                const data = await api.get<Order[]>(`/orders/session/${sessionId}`)
                setOrders(data)
            }
        } catch {
            // No session yet - empty orders
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const submitOrder = async () => {
        if (cartState.items.length === 0) {
            message.warning('장바구니가 비어있습니다')
            return
        }
        setOrderLoading(true)
        try {
            const res = await api.post<Order>('/orders', {
                items: cartState.items.map((i) => ({ menu_id: i.menuId, quantity: i.quantity })),
            })
            // Save session ID for future order queries
            if (res.id) {
                const orderData = await api.get<Order[]>(`/orders/session/${(res as any).session_id}`)
                setOrders(orderData)
                localStorage.setItem('sessionId', (res as any).session_id)
            }
            cartDispatch({ type: 'CLEAR' })
            message.success(`주문 완료! 주문번호: ${res.order_number}`)
            setTimeout(() => navigate('/customer/menu'), 5000)
        } catch (err: any) {
            message.error(err.detail || '주문 실패')
        } finally {
            setOrderLoading(false)
        }
    }

    if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

    return (
        <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
            {/* Cart section */}
            {cartState.items.length > 0 && (
                <>
                    <Title level={4}>장바구니</Title>
                    <List
                        dataSource={cartState.items}
                        renderItem={(item) => (
                            <List.Item
                                actions={[
                                    <Space key="qty">
                                        <Button
                                            size="small"
                                            icon={<MinusOutlined />}
                                            onClick={() => cartDispatch({ type: 'UPDATE_QUANTITY', menuId: item.menuId, quantity: item.quantity - 1 })}
                                            data-testid={`cart-minus-${item.menuId}`}
                                        />
                                        <Text>{item.quantity}</Text>
                                        <Button
                                            size="small"
                                            icon={<PlusOutlined />}
                                            onClick={() => cartDispatch({ type: 'UPDATE_QUANTITY', menuId: item.menuId, quantity: item.quantity + 1 })}
                                            data-testid={`cart-plus-${item.menuId}`}
                                        />
                                    </Space>,
                                    <Button
                                        key="del"
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => cartDispatch({ type: 'REMOVE_ITEM', menuId: item.menuId })}
                                        data-testid={`cart-remove-${item.menuId}`}
                                    />,
                                ]}
                            >
                                <List.Item.Meta title={item.name} description={`${(item.price * item.quantity).toLocaleString()}원`} />
                            </List.Item>
                        )}
                    />
                    <div style={{ textAlign: 'right', marginTop: 8 }}>
                        <Text strong>합계: {cartState.total.toLocaleString()}원</Text>
                    </div>
                    <Button
                        type="primary"
                        size="large"
                        block
                        loading={orderLoading}
                        onClick={submitOrder}
                        style={{ marginTop: 16 }}
                        data-testid="submit-order-button"
                    >
                        주문하기
                    </Button>
                    <Divider />
                </>
            )}

            {/* Order history */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4}>주문 내역</Title>
                <Button onClick={() => navigate('/customer/menu')} data-testid="back-to-menu">메뉴로</Button>
            </div>

            {orders.length === 0 ? (
                <Text type="secondary">아직 주문 내역이 없습니다</Text>
            ) : (
                <List
                    dataSource={orders}
                    renderItem={(order) => (
                        <Card size="small" style={{ marginBottom: 8 }} data-testid={`order-card-${order.id}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text strong>#{order.order_number}</Text>
                                <Tag color={statusColors[order.status]}>{statusLabels[order.status]}</Tag>
                            </div>
                            <div style={{ marginTop: 4 }}>
                                {order.items.map((item, idx) => (
                                    <Text key={idx} type="secondary" style={{ display: 'block', fontSize: 12 }}>
                                        {item.menu_name} x{item.quantity} ({(item.unit_price * item.quantity).toLocaleString()}원)
                                    </Text>
                                ))}
                            </div>
                            <Text strong style={{ display: 'block', marginTop: 4 }}>
                                {order.total_amount.toLocaleString()}원
                            </Text>
                        </Card>
                    )}
                />
            )}
        </div>
    )
}
