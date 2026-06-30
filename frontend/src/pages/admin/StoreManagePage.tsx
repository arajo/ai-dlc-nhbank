import { useState, useEffect } from 'react'
import { Card, Button, Table, Modal, Form, Input, Typography, message, Space, Tag, Collapse } from 'antd'
import { PlusOutlined, ArrowLeftOutlined, CopyOutlined, EditOutlined, ShopOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

const { Title, Text } = Typography

interface Store {
    id: string
    name: string
    username: string
}

interface TableInfo {
    id: number
    number: number
    has_session: boolean
}

export default function StoreManagePage() {
    const [stores, setStores] = useState<Store[]>([])
    const [storeTables, setStoreTables] = useState<Record<string, TableInfo[]>>({})
    const [modalOpen, setModalOpen] = useState(false)
    const [editingStore, setEditingStore] = useState<Store | null>(null)
    const [form] = Form.useForm()
    const navigate = useNavigate()

    useEffect(() => {
        loadStores()
    }, [])

    const loadStores = async () => {
        try {
            const data = await api.get<Store[]>('/auth/stores')
            setStores(data)
            // 각 매장의 테이블도 로드
            const tablesMap: Record<string, TableInfo[]> = {}
            for (const store of data) {
                try {
                    const tables = await api.get<TableInfo[]>(`/auth/stores/${store.id}/tables`)
                    tablesMap[store.id] = tables
                } catch {
                    tablesMap[store.id] = []
                }
            }
            setStoreTables(tablesMap)
        } catch {
            message.error('매장 목록 조회 실패')
        }
    }

    const handleCreate = async (values: { id: string; name: string; username: string; password: string }) => {
        try {
            await api.post('/auth/stores', values)
            message.success('매장 등록 완료!')
            setModalOpen(false)
            form.resetFields()
            loadStores()
        } catch (err: any) {
            message.error(err.detail || '매장 등록 실패')
        }
    }

    const handleUpdate = async (values: { id?: string; name?: string; username?: string; password?: string }) => {
        if (!editingStore) return
        try {
            const payload: any = {}
            if (values.id && values.id !== editingStore.id) payload.id = values.id
            if (values.name) payload.name = values.name
            if (values.username) payload.username = values.username
            if (values.password) payload.password = values.password

            await api.put(`/auth/stores/${editingStore.id}`, payload)
            message.success('매장 수정 완료!')
            setEditingStore(null)
            form.resetFields()
            loadStores()
        } catch (err: any) {
            message.error(err.detail || '매장 수정 실패')
        }
    }

    const openEdit = (store: Store) => {
        setEditingStore(store)
        form.setFieldsValue({ id: store.id, name: store.name, username: store.username, password: '' })
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        message.success('복사됨!')
    }

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/login')} style={{ marginBottom: 16 }}>
                뒤로
            </Button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={3}><ShopOutlined /> 매장 관리</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingStore(null); form.resetFields(); setModalOpen(true) }} data-testid="add-store-button">
                    매장 추가
                </Button>
            </div>

            {/* 매장 목록 - 펼치면 테이블 보임 */}
            <Collapse
                accordion
                items={stores.map((store) => ({
                    key: store.id,
                    label: (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span>
                                <Text strong style={{ fontSize: 16 }}>{store.name}</Text>
                                <Text type="secondary" style={{ marginLeft: 12 }}>@{store.username}</Text>
                            </span>
                            <Space onClick={(e) => e.stopPropagation()}>
                                <Text code style={{ fontSize: 11 }}>{store.id}</Text>
                                <Button size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(store.id)} />
                                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(store)}>수정</Button>
                            </Space>
                        </div>
                    ),
                    children: (
                        <div>
                            <Text strong>테이블 목록 ({storeTables[store.id]?.length || 0}개)</Text>
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {(storeTables[store.id] || []).length === 0 ? (
                                    <Text type="secondary">등록된 테이블이 없습니다</Text>
                                ) : (
                                    (storeTables[store.id] || []).map((t) => (
                                        <Tag
                                            key={t.id}
                                            color={t.has_session ? 'green' : 'default'}
                                            style={{ padding: '4px 12px', fontSize: 14 }}
                                        >
                                            테이블 {t.number} {t.has_session ? '(이용중)' : ''}
                                        </Tag>
                                    ))
                                )}
                            </div>
                        </div>
                    ),
                }))}
            />

            {/* 매장 추가 모달 */}
            <Modal
                title="매장 등록"
                open={modalOpen}
                onCancel={() => { setModalOpen(false); form.resetFields() }}
                onOk={() => form.submit()}
                okText="등록"
                cancelText="취소"
            >
                <Form form={form} layout="vertical" onFinish={handleCreate} data-testid="add-store-form">
                    <Form.Item name="id" label="매장 ID" rules={[{ required: true, message: '매장 ID를 입력하세요' }]}>
                        <Input placeholder="예: store-002 (직접 지정)" data-testid="add-store-id" />
                    </Form.Item>
                    <Form.Item name="name" label="매장명" rules={[{ required: true, message: '매장명을 입력하세요' }]}>
                        <Input placeholder="예: 맛있는 식당 2호점" data-testid="add-store-name" />
                    </Form.Item>
                    <Form.Item name="username" label="관리자 사용자명" rules={[{ required: true, message: '사용자명을 입력하세요' }]}>
                        <Input placeholder="예: admin2" data-testid="add-store-username" />
                    </Form.Item>
                    <Form.Item name="password" label="관리자 비밀번호" rules={[{ required: true, message: '비밀번호를 입력하세요' }]}>
                        <Input.Password placeholder="관리자 로그인 비밀번호" data-testid="add-store-password" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 매장 수정 모달 */}
            <Modal
                title={`매장 수정 — ${editingStore?.name || ''}`}
                open={!!editingStore}
                onCancel={() => { setEditingStore(null); form.resetFields() }}
                onOk={() => form.submit()}
                okText="저장"
                cancelText="취소"
            >
                <Form form={form} layout="vertical" onFinish={handleUpdate}>
                    <Form.Item name="id" label="매장 ID">
                        <Input placeholder="변경할 매장 ID (비워두면 유지)" />
                    </Form.Item>
                    <Form.Item name="name" label="매장명">
                        <Input placeholder="변경할 매장명 (비워두면 유지)" />
                    </Form.Item>
                    <Form.Item name="username" label="관리자 사용자명">
                        <Input placeholder="변경할 사용자명 (비워두면 유지)" />
                    </Form.Item>
                    <Form.Item name="password" label="비밀번호 변경">
                        <Input.Password placeholder="새 비밀번호 (비워두면 유지)" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
