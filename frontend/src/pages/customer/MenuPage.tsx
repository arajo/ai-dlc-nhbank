import { useState, useEffect, useRef } from 'react'
import { Card, Row, Col, Button, message, Spin, Typography, List, Space, Modal, Tag, Badge, Popover, notification, Divider } from 'antd'
import { MinusOutlined, PlusOutlined, DeleteOutlined, UnorderedListOutlined, BellOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { api } from '../../api/client'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'

const { Meta } = Card
const { Title, Text } = Typography

interface MenuItemData {
    id: number
    category_id: number
    name: string
    price: number
    description: string | null
    image_url: string | null
    sort_order: number
}

interface Category {
    id: number
    name: string
    sort_order: number
}

interface Order {
    id: number
    order_number: string
    status: string
    total_amount: number
    items: { menu_name: string; quantity: number; unit_price: number }[]
    created_at: string
}

const statusColors: Record<string, string> = { pending: 'orange', preparing: 'blue', completed: 'green' }
const statusLabels: Record<string, string> = { pending: '대기중', preparing: '준비중', completed: '완료' }

export default function MenuPage() {
    const [menus, setMenus] = useState<MenuItemData[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [activeCategory, setActiveCategory] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [orderLoading, setOrderLoading] = useState(false)
    const [orderModalOpen, setOrderModalOpen] = useState(false)
    const [orders, setOrders] = useState<Order[]>([])
    const [notifications, setNotifications] = useState<{ id: number; text: string; time: string }[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const eventSourceRef = useRef<EventSource | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({})
    const { state: cartState, dispatch: cartDispatch } = useCart()
    const { state: authState, dispatch } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!authState.isAuthenticated) {
            navigate('/customer/login')
            return
        }
        loadData()
        connectSSE()
        return () => { eventSourceRef.current?.close() }
    }, [authState.isAuthenticated])

    const connectSSE = () => {
        const token = localStorage.getItem('token')
        const storeId = authState.storeId
        if (!token || !storeId) return

        const url = `/api/sse/orders?store_id=${storeId}&token=${token}`
        try {
            const es = new EventSource(url)
            eventSourceRef.current = es

            es.addEventListener('order_updated', (e) => {
                try {
                    const data = JSON.parse(e.data)
                    const statusText = statusLabels[data.status] || data.status
                    const msg = `주문 #${data.order_number} → ${statusText}`
                    setNotifications((prev) => [
                        { id: Date.now(), text: msg, time: new Date().toLocaleTimeString() },
                        ...prev.slice(0, 19),
                    ])
                    setUnreadCount((prev) => prev + 1)
                    notification.info({
                        message: '주문 상태 변경',
                        description: msg,
                        placement: 'topRight',
                        duration: 4,
                    })
                } catch { /* ignore */ }
            })

            es.onerror = () => { es.close() }
        } catch { /* ignore */ }
    }

    const loadData = async () => {
        try {
            const [cats, items] = await Promise.all([
                api.get<Category[]>('/menus/categories'),
                api.get<MenuItemData[]>('/menus'),
            ])
            setCategories(cats)
            setMenus(items)
            if (cats.length > 0) setActiveCategory(cats[0].id)
        } catch {
            message.error('데이터 로딩 실패')
        } finally {
            setLoading(false)
        }
    }

    const addToCart = (item: MenuItemData, e?: React.MouseEvent) => {
        cartDispatch({
            type: 'ADD_ITEM',
            item: { menuId: item.id, name: item.name, price: item.price, imageUrl: item.image_url || undefined },
        })
        // 클릭한 위치에서 폭죽
        if (e) {
            const x = e.clientX / window.innerWidth
            const y = e.clientY / window.innerHeight
            confetti({
                particleCount: 20,
                spread: 40,
                startVelocity: 15,
                gravity: 1.5,
                origin: { x, y },
                colors: ['#ff6b35', '#ffd700', '#ff8c00'],
                scalar: 0.7,
            })
        }
        message.success(`${item.name} 추가됨`)
    }

    const submitOrder = async () => {
        if (cartState.items.length === 0) return
        setOrderLoading(true)
        try {
            const res = await api.post<any>('/orders', {
                items: cartState.items.map((i) => ({ menu_id: i.menuId, quantity: i.quantity })),
            })
            if (res.session_id) localStorage.setItem('sessionId', res.session_id)
            cartDispatch({ type: 'CLEAR' })
            message.success(`주문 완료! 주문번호: ${res.order_number}`)

            // 🎉 폭죽 애니메이션
            const duration = 2000
            const end = Date.now() + duration
            const colors = ['#ff6b35', '#ffd700', '#ff4500', '#ff8c00', '#ffaa00']

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.7 },
                    colors,
                })
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.7 },
                    colors,
                })
                if (Date.now() < end) requestAnimationFrame(frame)
            }
            frame()

            // 중앙 폭발
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { x: 0.5, y: 0.5 },
                colors,
            })
        } catch (err: any) {
            message.error(err.detail || '주문 실패')
        } finally {
            setOrderLoading(false)
        }
    }

    const openOrderHistory = async () => {
        const sessionId = localStorage.getItem('sessionId')
        if (sessionId) {
            try {
                const data = await api.get<Order[]>(`/orders/session/${sessionId}`)
                setOrders(data)
            } catch { setOrders([]) }
        }
        setOrderModalOpen(true)
    }

    // 카테고리 클릭 시 해당 섹션으로 스크롤
    const scrollToCategory = (catId: number) => {
        setActiveCategory(catId)
        const el = sectionRefs.current[catId]
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    // 스크롤 시 현재 보이는 카테고리 감지
    const handleScroll = () => {
        const container = scrollRef.current
        if (!container) return
        for (const cat of categories) {
            const el = sectionRefs.current[cat.id]
            if (el) {
                const rect = el.getBoundingClientRect()
                const containerRect = container.getBoundingClientRect()
                if (rect.top >= containerRect.top && rect.top < containerRect.top + 200) {
                    setActiveCategory(cat.id)
                    break
                }
            }
        }
    }

    if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

    return (
        <div className="menu-page" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Left sidebar - 카테고리 (클릭 시 스크롤 이동) */}
            <div className="category-sidebar" style={{ width: 110, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Title level={5} style={{ margin: 0, textAlign: 'center', color: '#fff' }}>카테고리</Title>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => scrollToCategory(cat.id)}
                            style={{
                                padding: '16px 12px',
                                cursor: 'pointer',
                                fontSize: 15,
                                fontWeight: activeCategory === cat.id ? 700 : 400,
                                color: activeCategory === cat.id ? '#ff6b35' : '#aaa',
                                borderLeft: activeCategory === cat.id ? '3px solid #ff6b35' : '3px solid transparent',
                                background: activeCategory === cat.id ? 'rgba(255,107,53,0.1)' : 'transparent',
                                transition: 'all 0.2s',
                            }}
                            data-testid={`category-${cat.id}`}
                        >
                            {cat.name}
                        </div>
                    ))}
                </div>
                <Button
                    className="order-history-btn"
                    type="text"
                    icon={<UnorderedListOutlined />}
                    onClick={openOrderHistory}
                    style={{ margin: 8, fontSize: 13, color: '#aaa' }}
                    data-testid="order-history-link"
                >
                    주문내역
                </Button>
                <Button
                    type="text"
                    onClick={() => {
                        cartDispatch({ type: 'CLEAR' })
                        localStorage.removeItem('sessionId')
                        dispatch({ type: 'LOGOUT' })
                        navigate('/customer/login')
                    }}
                    style={{ margin: '0 8px 8px 8px', fontSize: 12, color: '#666' }}
                    data-testid="customer-logout"
                >
                    로그아웃
                </Button>
            </div>

            {/* Center - 전체 메뉴 스크롤 (카테고리별 섹션) */}
            <div className="menu-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <div className="menu-header" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0, color: '#fff' }}>메뉴</Title>
                    <Popover
                        title="알림"
                        trigger="click"
                        placement="bottomRight"
                        onOpenChange={(open) => { if (open) setUnreadCount(0) }}
                        content={
                            <div style={{ width: 260, maxHeight: 300, overflowY: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <Text type="secondary">알림이 없습니다</Text>
                                ) : (
                                    notifications.map((n) => (
                                        <div key={n.id} style={{ padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                                            <Text style={{ fontSize: 13 }}>{n.text}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 11 }}>{n.time}</Text>
                                        </div>
                                    ))
                                )}
                            </div>
                        }
                    >
                        <Badge count={unreadCount} size="small">
                            <Button className="notification-bell" icon={<BellOutlined />} shape="circle" data-testid="notification-bell" />
                        </Badge>
                    </Popover>
                </div>

                {/* Scrollable menu - all categories stacked */}
                <div ref={scrollRef} onScroll={handleScroll} className="menu-scroll" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    {categories.map((cat) => {
                        const catMenus = menus.filter((m) => m.category_id === cat.id)
                        if (catMenus.length === 0) return null
                        return (
                            <div
                                key={cat.id}
                                ref={(el) => { sectionRefs.current[cat.id] = el }}
                                style={{ marginBottom: 32 }}
                            >
                                <h3 className="section-title">{cat.name}</h3>
                                <Row gutter={[12, 12]}>
                                    {catMenus.map((item) => (
                                        <Col xs={8} sm={6} md={6} key={item.id}>
                                            <Card
                                                className="menu-card"
                                                hoverable
                                                cover={
                                                    item.image_url ? (
                                                        <img alt={item.name} src={item.image_url} style={{ height: 130, objectFit: 'cover', width: '100%', borderRadius: '12px 12px 0 0' }} />
                                                    ) : (
                                                        <div style={{ height: 130, background: '#3a3a50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, borderRadius: '12px 12px 0 0' }}>🍽️</div>
                                                    )
                                                }
                                                onClick={(e) => addToCart(item, e)}
                                                data-testid={`menu-card-${item.id}`}
                                                bodyStyle={{ padding: 10 }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span className="menu-name">{item.name}</span>
                                                    <span className="menu-price">{item.price.toLocaleString()}원</span>
                                                </div>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Right sidebar - 장바구니 */}
            <div className="cart-sidebar" style={{ width: 280, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={5} style={{ margin: 0, color: '#fff' }}>장바구니</Title>
                    {cartState.items.length > 0 && (
                        <Button size="small" type="text" danger onClick={() => cartDispatch({ type: 'CLEAR' })} data-testid="cart-clear">
                            비우기
                        </Button>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                    {cartState.items.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: 40 }}>
                            <span className="cart-empty-icon">🛒</span>
                            <Text type="secondary" style={{ color: '#666' }}>
                                메뉴를 선택해주세요
                            </Text>
                        </div>
                    ) : (
                        <List
                            size="small"
                            dataSource={cartState.items}
                            renderItem={(item) => (
                                <List.Item style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text strong className="cart-item-name" style={{ fontSize: 14 }}>{item.name}</Text>
                                            <Button
                                                size="small"
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => cartDispatch({ type: 'REMOVE_ITEM', menuId: item.menuId })}
                                                data-testid={`cart-remove-${item.menuId}`}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                            <Space size={4}>
                                                <Button
                                                    size="small"
                                                    icon={<MinusOutlined />}
                                                    onClick={() => cartDispatch({ type: 'UPDATE_QUANTITY', menuId: item.menuId, quantity: item.quantity - 1 })}
                                                    data-testid={`cart-minus-${item.menuId}`}
                                                />
                                                <span style={{ minWidth: 24, textAlign: 'center', display: 'inline-block' }}>{item.quantity}</span>
                                                <Button
                                                    size="small"
                                                    icon={<PlusOutlined />}
                                                    onClick={() => cartDispatch({ type: 'UPDATE_QUANTITY', menuId: item.menuId, quantity: item.quantity + 1 })}
                                                    data-testid={`cart-plus-${item.menuId}`}
                                                />
                                            </Space>
                                            <Text className="cart-item-price" style={{ fontSize: 14 }}>{(item.price * item.quantity).toLocaleString()}원</Text>
                                        </div>
                                    </div>
                                </List.Item>
                            )}
                        />
                    )}
                </div>

                {cartState.items.length > 0 && (
                    <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text strong className="cart-total">합계</Text>
                            <Text strong className="cart-total-amount">{cartState.total.toLocaleString()}원</Text>
                        </div>
                        <Button
                            className="order-button"
                            type="primary"
                            size="large"
                            block
                            loading={orderLoading}
                            onClick={submitOrder}
                            data-testid="submit-order-button"
                        >
                            주문하기 ({cartState.items.length}개)
                        </Button>
                    </div>
                )}
            </div>

            {/* 주문내역 팝업 */}
            <Modal
                title="주문 내역"
                open={orderModalOpen}
                onCancel={() => setOrderModalOpen(false)}
                footer={null}
                width={500}
                data-testid="order-history-modal"
            >
                {orders.length === 0 ? (
                    <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 40 }}>
                        아직 주문 내역이 없습니다
                    </Text>
                ) : (
                    <List
                        dataSource={orders}
                        renderItem={(order) => (
                            <Card size="small" style={{ marginBottom: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong>#{order.order_number}</Text>
                                    <Tag color={statusColors[order.status]}>{statusLabels[order.status]}</Tag>
                                </div>
                                <div style={{ marginTop: 4 }}>
                                    {order.items.map((item, idx) => (
                                        <Text key={idx} type="secondary" style={{ display: 'block', fontSize: 13 }}>
                                            {item.menu_name} x{item.quantity} ({(item.unit_price * item.quantity).toLocaleString()}원)
                                        </Text>
                                    ))}
                                </div>
                                <Text strong style={{ display: 'block', marginTop: 4 }}>
                                    {order.total_amount.toLocaleString()}원
                                </Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    {new Date(order.created_at).toLocaleTimeString()}
                                </Text>
                            </Card>
                        )}
                    />
                )}
            </Modal>
        </div>
    )
}
