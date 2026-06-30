import { useState, useEffect } from 'react'
import { Card, Button, List, Tag, Typography, message, Popconfirm, Modal, Spin } from 'antd'
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'

const { Title, Text } = Typography

interface Order {
    id: number
    order_number: string
    status: string
    total_amount: number
    items: { menu_name: string; quantity: number; unit_price: number }[]
    created_at: string
}

interface OrderHistory {
    id: number
    order_number: string
    items_json: string
    total_amount: number
    ordered_at: string
    completed_at: string
}

interface TableSummary {
    id: number
    number: number
    current_session_id: string | null
    total_order_amount: number
    active_order_count: number
}

const statusColors: Record<string, string> = { pending: 'orange', preparing: 'blue', completed: 'green' }
const statusLabels: Record<string, string> = { pending: '대기중', preparing: '준비중', completed: '완료' }

export default function TableDetailPage() {
    const { tableId } = useParams<{ tableId: string }>()
    const [summary, setSummary] = useState<TableSummary | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [history, setHistory] = useState<OrderHistory[]>([])
    const [historyOpen, setHistoryOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const { state: authState } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!authState.isAuthenticated || authState.type !== 'admin') {
            navigate('/admin/login')
            return
        }
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [summaryData, orderData] = await Promise.all([
                api.get<TableSummary>(`/tables/${tableId}/summary`),
                api.get<Order[]>('/orders/active'),
            ])
            setSummary(summaryData)
            setOrders(orderData.filter((o) => o.table_id === Number(tableId)))
        } catch (err: any) {
            message.error('데이터 로딩 실패')
        } finally {
            setLoading(false)
        }
    }

    const deleteOrder = async (orderId: number) => {
        try {
            await api.delete(`/orders/${orderId}`)
            message.success('주문 삭제 완료')
            loadData()
        } catch (err: any) {
            message.error(err.detail || '삭제 실패')
        }
    }

    const endSession = async () => {
        try {
            await api.post(`/tables/${tableId}/end-session`)
            message.success('이용 완료 처리되었습니다')
            loadData()
        } catch (err: any) {
            message.error(err.detail || '이용 완료 실패')
        }
    }

    const loadHistory = async () => {
        try {
            const data = await api.get<OrderHistory[]>(`/orders/history/${tableId}`)
            setHistory(data)
            setHistoryOpen(true)
        } catch {
            message.error('이력 조회 실패')
        }
    }

    const updateStatus = async (orderId: number, status: string) => {
        await api.patch(`/orders/${orderId}/status`, { status })
        loadData()
    }

    if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

    return (
        <div style={{ padding: 16, maxWidth: 700, margin: '0 auto' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: 16 }}>
                대시보드
            </Button>

            <Card title={`테이블 ${summary?.number}`} style={{ marginBottom: 16 }}>
                <Text strong>총 주문액: {summary?.total_order_amount.toLocaleString()}원</Text>
                <br />
                <Text>활성 주문: {summary?.active_order_count}건</Text>
                <div style={{ marginTop: 12 }}>
                    <Popconfirm title="이용 완료 처리하시겠습니까?" onConfirm={endSession}>
                        <Button type="primary" danger data-testid="end-session-button">이용 완료</Button>
                    </Popconfirm>
                    <Button onClick={loadHistory} style={{ marginLeft: 8 }} data-testid="view-history-button">과거 내역</Button>
                </div>
            </Card>

            <Title level={5}>현재 주문</Title>
            <List
                dataSource={orders}
                locale={{ emptyText: '현재 주문이 없습니다' }}
                renderItem={(order) => (
                    <Card size="small" style={{ marginBottom: 8 }} data-testid={`admin-order-${order.id}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <Text strong>#{order.order_number}</Text>
                                <Tag color={statusColors[order.status]} style={{ marginLeft: 8 }}>{statusLabels[order.status]}</Tag>
                            </div>
                            <div>
                                {order.status === 'pending' && <Button size="small" onClick={() => updateStatus(order.id, 'preparing')}>준비 시작</Button>}
                                {order.status === 'preparing' && <Button size="small" onClick={() => updateStatus(order.id, 'completed')}>완료</Button>}
                                <Popconfirm title="주문을 삭제하시겠습니까?" onConfirm={() => deleteOrder(order.id)}>
                                    <Button size="small" danger icon={<DeleteOutlined />} style={{ marginLeft: 4 }} data-testid={`delete-order-${order.id}`} />
                                </Popconfirm>
                            </div>
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12 }}>
                            {order.items.map((item, i) => (
                                <div key={i}>{item.menu_name} x{item.quantity}</div>
                            ))}
                        </div>
                        <Text strong>{order.total_amount.toLocaleString()}원</Text>
                    </Card>
                )}
            />

            <Modal title="과거 주문 내역" open={historyOpen} onCancel={() => setHistoryOpen(false)} footer={null} width={600}>
                <List
                    dataSource={history}
                    locale={{ emptyText: '과거 내역이 없습니다' }}
                    renderItem={(h) => (
                        <Card size="small" style={{ marginBottom: 8 }}>
                            <Text strong>#{h.order_number}</Text> — {h.total_amount.toLocaleString()}원
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                주문: {new Date(h.ordered_at).toLocaleString()} | 완료: {new Date(h.completed_at).toLocaleString()}
                            </Text>
                        </Card>
                    )}
                />
            </Modal>
        </div>
    )
}
