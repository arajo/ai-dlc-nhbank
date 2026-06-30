import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Typography, Popconfirm } from 'antd'
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'

const { Title } = Typography

interface MenuItem {
    id: number
    category_id: number
    name: string
    price: number
    description: string | null
    image_url: string | null
    sort_order: number
    is_active: boolean
}

interface Category {
    id: number
    name: string
}

export default function MenuManagePage() {
    const [menus, setMenus] = useState<MenuItem[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
    const [form] = Form.useForm()
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
        const [menuData, catData] = await Promise.all([
            api.get<MenuItem[]>('/menus'),
            api.get<Category[]>('/menus/categories'),
        ])
        setMenus(menuData)
        setCategories(catData)
    }

    const handleSave = async (values: any) => {
        try {
            if (editingItem) {
                await api.put(`/menus/${editingItem.id}`, values)
                message.success('메뉴 수정 완료')
            } else {
                await api.post('/menus', values)
                message.success('메뉴 등록 완료')
            }
            setModalOpen(false)
            form.resetFields()
            setEditingItem(null)
            loadData()
        } catch (err: any) {
            message.error(err.detail || '저장 실패')
        }
    }

    const handleDelete = async (id: number) => {
        await api.delete(`/menus/${id}`)
        message.success('삭제 완료')
        loadData()
    }

    const openEdit = (item: MenuItem) => {
        setEditingItem(item)
        form.setFieldsValue(item)
        setModalOpen(true)
    }

    const columns = [
        { title: '메뉴명', dataIndex: 'name', key: 'name' },
        { title: '가격', dataIndex: 'price', key: 'price', render: (v: number) => `${v.toLocaleString()}원` },
        { title: '카테고리', dataIndex: 'category_id', key: 'cat', render: (v: number) => categories.find((c) => c.id === v)?.name || '-' },
        {
            title: '관리', key: 'actions', render: (_: any, record: MenuItem) => (
                <>
                    <Button size="small" onClick={() => openEdit(record)} data-testid={`edit-menu-${record.id}`}>수정</Button>
                    <Popconfirm title="삭제하시겠습니까?" onConfirm={() => handleDelete(record.id)}>
                        <Button size="small" danger style={{ marginLeft: 4 }} data-testid={`delete-menu-${record.id}`}>삭제</Button>
                    </Popconfirm>
                </>
            ),
        },
    ]

    return (
        <div style={{ padding: 16 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: 16 }}>대시보드</Button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={4}>메뉴 관리</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.resetFields(); setModalOpen(true) }} data-testid="add-menu-button">
                    메뉴 추가
                </Button>
            </div>
            <Table dataSource={menus} columns={columns} rowKey="id" pagination={false} data-testid="menu-table" />

            <Modal title={editingItem ? '메뉴 수정' : '메뉴 등록'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
                <Form form={form} layout="vertical" onFinish={handleSave} data-testid="menu-form">
                    <Form.Item name="name" label="메뉴명" rules={[{ required: true }]}>
                        <Input data-testid="menu-form-name" />
                    </Form.Item>
                    <Form.Item name="price" label="가격" rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} data-testid="menu-form-price" />
                    </Form.Item>
                    <Form.Item name="category_id" label="카테고리" rules={[{ required: true }]}>
                        <Select data-testid="menu-form-category">
                            {categories.map((c) => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="description" label="설명">
                        <Input.TextArea data-testid="menu-form-description" />
                    </Form.Item>
                    <Form.Item name="image_url" label="이미지 URL">
                        <Input data-testid="menu-form-image-url" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
