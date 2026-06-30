import { useState, useEffect, useRef } from 'react'
import { Card, Row, Col, Tag, Button, Typography, message, Badge, Modal, List, Popconfirm, Space, DatePicker, Form, Input, InputNumber } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'

const { Title, Text } = Typography

interface OrderItem {
    menu_name: string
    quantity: number
    unit_price: number
}

interface Order {
    id: number
    order_number: string
    table_id: number
    status: string
    total_amount: number
    items: OrderItem[]
    created_at: string
}

interface OrderHistory {
    id: number
    order_number: string
    table_id: number
    session_id: string
    items_json: string
    total_amount: number
    ordered_at: string
    completed_at: string
}

interface TableInfo {
    id: number
    number: number
    current_session_id: string | null
    is_active: boolean
}

const statusColors: Record<string, string> = { pending: 'orange', preparing: 'blue', completed: 'green' }
const statusLabels: Record<string, string> = { pending: '대기중', preparing: '준비중', completed: '완료' }

export default function DashboardPage() {
    const [tables, setTables] = useState<TableInfo[]>([])
    const [orders, setOrders] = useState<Order[]>([])
    const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [historyModalOpen, setHistoryModalOpen] = useState(false)
    const [historyData, setHistoryData] = useState<OrderHistory[]>([])
    const [addTableModalOpen, setAddTableModalOpen] = useState(false)
    const [addTableForm] = Form.useForm()
    const { state: authState, dispatch } = useAuth()
    const navigate = useNavigate()
    const eventSourceRef = useRef<EventSource | null>(null)

    useEffect(() => {
        if (!authState.isAuthenticated || authState.type !== 'admin') {
            navigate('/admin/login')
            return
        }
        loadData()
        connectSSE()
        return () => { eventSourceRef.current?.close() }
    }, [])

    const loadData = async () => {
        try {
            const [tableData, orderData] = await Promise.all([
                api.get<TableInfo[]>('/tables'),
                api.get<Order[]>('/orders/active'),
            ])
            setTables(tableData)
            setOrders(orderData)
        } catch {
            message.error('데이터 로딩 실패')
        }
    }

    const connectSSE = () => {
        const token = localStorage.getItem('token')
        const storeId = authState.storeId
        if (!token || !storeId) return

        const url = `/api/sse/orders?store_id=${storeId}&token=${token}`
        try {
            const es = new EventSource(url)
            eventSourceRef.current = es
            es.addEventListener('order_created', () => loadData())
            es.addEventListener('order_updated', () => loadData())
            es.addEventListener('order_deleted', () => loadData())
            es.addEventListener('session_ended', () => loadData())
            es.onerror = () => { es.close() }
        } catch {
            // SSE 미지원시 무시
        }
    }

    const updateStatus = async (orderId: number, status: string) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status })
            loadData()
        } catch (err: any) {
            message.error(err.detail || '상태 변경 실패')
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

    const endSession = async (tableId: number) => {
        try {
            await api.post(`/tables/${tableId}/end-session`)
            message.success('이용 완료 처리됨')
            setModalOpen(false)
            loadData()
        } catch (err: any) {
            message.error(err.detail || '이용 완료 실패')
        }
    }

    const addTable = async (values: { table_number: number; password: string }) => {
        try {
            await api.post('/tables', values)
            message.success(`테이블 ${values.table_number} 추가 완료`)
            setAddTableModalOpen(false)
            addTableForm.resetFields()
            loadData()
        } catch (err: any) {
            message.error(err.detail || '테이블 추가 실패')
        }
    }

    const loadAllHistory = async (dateStr?: string) => {
        try {
            const params = dateStr ? `?start_date=${dateStr}&end_date=${dateStr}T23:59:59` : ''
            const data = await api.get<OrderHistory[]>(`/orders/history${params}`)
            setHistoryData(data)
            setHistoryModalOpen(true)
        } catch {
            message.error('이력 조회 실패')
        }
    }

    const getTableOrders = (tableId: number) => orders.filter((o) => o.table_id === tableId)

    const openTableDetail = (table: TableInfo) => {
        setSelectedTable(table)
        setModalOpen(true)
    }

    const selectedOrders = selectedTable ? getTableOrders(selectedTable.id) : []

    return (
        <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>주문 대시보드</Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DatePicker
                        onChange={(_, dateStr) => {
                            if (dateStr) loadAllHistory(dateStr as string)
                        }}
                        placeholder="날짜별 이력"
                        allowClear
                        style={{ width: 150 }}
                    />
                    <Button onClick={() => loadAllHistory()}>전체 이력</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddTableModalOpen(true)}>테이블 추가</Button>
                    <Button onClick={() => navigate('/admin/menus')}>메뉴 관리</Button>
                    <Button onClick={loadData}>새로고침</Button>
                    <Button danger onClick={() => { dispatch({ type: 'LOGOUT' }); navigate('/admin/login') }}>로그아웃</Button>
                </div>
            </div>

            <Row gutter={[16, 16]}>
                {tables.map((table) => {
                    const tableOrders = getTableOrders(table.id)
                    const totalAmount = tableOrders.reduce((sum, o) => sum + o.total_amount, 0)
                    return (
                        <Col xs={24} sm={12} md={8} lg={6} key={table.id}>
                            <Card
                                title={`테이블 ${table.number}`}
                                extra={<Badge count={tableOrders.length} />}
                                hoverable
                                onClick={() => openTableDetail(table)}
                                data-testid={`table-card-${table.id}`}
                            >
                                <Text strong>총 주문액: {totalAmount.toLocaleString()}원</Text>
                                <div style={{ marginTop: 8 }}>
                                    {tableOrders.slice(0, 3).map((order) => (
                                        <div key={order.id} style={{ fontSize: 12, marginBottom: 4 }}>
                                            <Tag color={statusColors[order.status]} style={{ fontSize: 10 }}>
                                                {statusLabels[order.status]}
                                            </Tag>
                                            #{order.order_number} - {order.total_amount.toLocaleString()}원
                                        </div>
                                    ))}
                                    {tableOrders.length > 3 && (
                                        <Text type="secondary" style={{ fontSize: 11 }}>+{tableOrders.length - 3}건 더</Text>
                                    )}
                                </div>
                            </Card>
                        </Col>
                    )
                })}
            </Row>

            {/* 테이블 주문 상세 팝업 */}
            <Modal
                title={selectedTable ? `테이블 ${selectedTable.number} — 주문 상세` : ''}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                width={600}
                footer={
                    selectedTable ? (
                        <Space>
                            <Popconfirm title="이용 완료 처리하시겠습니까?" onConfirm={() => endSession(selectedTable.id)}>
                                <Button type="primary" danger data-testid="end-session-button">이용 완료</Button>
                            </Popconfirm>
                            <Button onClick={() => setModalOpen(false)}>닫기</Button>
                        </Space>
                    ) : null
                }
            >
                {selectedOrders.length === 0 ? (
                    <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 40 }}>
                        현재 주문이 없습니다
                    </Text>
                ) : (
                    <>
                        <div style={{ marginBottom: 12 }}>
                            <Text strong style={{ fontSize: 16 }}>
                                총 주문액: {selectedOrders.reduce((sum, o) => sum + o.total_amount, 0).toLocaleString()}원
                            </Text>
                            <Text type="secondary" style={{ marginLeft: 12 }}>({selectedOrders.length}건)</Text>
                        </div>
                        <List
                            dataSource={selectedOrders}
                            renderItem={(order) => (
                                <Card size="small" style={{ marginBottom: 8 }} data-testid={`admin-order-${order.id}`}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <Text strong>#{order.order_number}</Text>
                                            <Tag color={statusColors[order.status]} style={{ marginLeft: 8 }}>{statusLabels[order.status]}</Tag>
                                            <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                                                {new Date(order.created_at).toLocaleTimeString()}
                                            </Text>
                                        </div>
                                        <Space size={4}>
                                            {order.status === 'pending' && (
                                                <Button size="small" onClick={() => updateStatus(order.id, 'preparing')}>준비시작</Button>
                                            )}
                                            {order.status === 'preparing' && (
                                                <Button size="small" type="primary" onClick={() => updateStatus(order.id, 'completed')}>완료</Button>
                                            )}
                                            <Popconfirm title="삭제하시겠습니까?" onConfirm={() => deleteOrder(order.id)}>
                                                <Button size="small" danger icon={<DeleteOutlined />} data-testid={`delete-order-${order.id}`} />
                                            </Popconfirm>
                                        </Space>
                                    </div>
                                    <div style={{ marginTop: 6 }}>
                                        {order.items.map((item, i) => (
                                            <div key={i} style={{ fontSize: 13, color: '#555' }}>
                                                {item.menu_name} x{item.quantity} — {(item.unit_price * item.quantity).toLocaleString()}원
                                            </div>
                                        ))}
                                    </div>
                                    <Text strong style={{ fontSize: 14, display: 'block', marginTop: 4 }}>
                                        {order.total_amount.toLocaleString()}원
                                    </Text>
                                </Card>
                            )}
                        />
                    </>
                )}
            </Modal>

            {/* 전체 주문 이력 모달 */}
            <Modal
                title="전체 주문 이력"
                open={historyModalOpen}
                onCancel={() => setHistoryModalOpen(false)}
                footer={null}
                width={700}
            >
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary">{historyData.length}건</Text>
                    {historyData.length > 0 && (
                        <Text strong>합계: {historyData.reduce((sum, h) => sum + h.total_amount, 0).toLocaleString()}원</Text>
                    )}
                </div>

                {historyData.length === 0 ? (
                    <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 40 }}>
                        주문 이력이 없습니다
                    </Text>
                ) : (
                    <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                        <List
                            dataSource={historyData}
                            renderItem={(h) => {
                                const items = JSON.parse(h.items_json)
                                const tableInfo = tables.find((t) => t.id === h.table_id)
                                return (
                                    <Card size="small" style={{ marginBottom: 8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <Tag color="blue">테이블 {tableInfo?.number || h.table_id}</Tag>
                                                <Text strong>#{h.order_number}</Text>
                                            </div>
                                            <Text strong style={{ color: '#e74c3c' }}>{h.total_amount.toLocaleString()}원</Text>
                                        </div>
                                        <div style={{ marginTop: 6 }}>
                                            {items.map((item: any, i: number) => (
                                                <Text key={i} type="secondary" style={{ display: 'block', fontSize: 13 }}>
                                                    {item.menu_name} x{item.quantity} — {(item.unit_price * item.quantity).toLocaleString()}원
                                                </Text>
                                            ))}
                                        </div>
                                        <div style={{ marginTop: 4, fontSize: 11, color: '#999' }}>
                                            주문: {new Date(h.ordered_at).toLocaleString()} | 완료: {new Date(h.completed_at).toLocaleString()}
                                        </div>
                                    </Card>
                                )
                            }}
                        />
                    </div>
                )}
            </Modal>

            {/* 테이블 추가 모달 */}
            <Modal
                title="테이블 추가"
                open={addTableModalOpen}
                onCancel={() => { setAddTableModalOpen(false); addTableForm.resetFields() }}
                onOk={() => addTableForm.submit()}
                okText="추가"
                cancelText="취소"
            >
                <Form form={addTableForm} layout="vertical" onFinish={addTable} data-testid="add-table-form">
                    <Form.Item name="table_number" label="테이블 번호" rules={[{ required: true, message: '테이블 번호를 입력하세요' }]}>
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="예: 4" data-testid="add-table-number" />
                    </Form.Item>
                    <Form.Item name="password" label="테이블 비밀번호" rules={[{ required: true, message: '비밀번호를 입력하세요' }]}>
                        <Input.Password placeholder="고객이 로그인할 때 사용하는 비밀번호" data-testid="add-table-password" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
