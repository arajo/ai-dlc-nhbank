import { useState } from 'react'
import { Form, Input, Button, Card, message, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../api/client'

const { Title } = Typography

interface TableLoginResponse {
    access_token: string
    table_id: number
    store_id: string
    table_number: number
}

export default function CustomerLoginPage() {
    const [loading, setLoading] = useState(false)
    const { dispatch } = useAuth()
    const navigate = useNavigate()

    const onFinish = async (values: { store_id: string; table_number: number; password: string }) => {
        setLoading(true)
        try {
            const res = await api.post<TableLoginResponse>('/auth/table/login', values)
            dispatch({
                type: 'LOGIN_TABLE',
                token: res.access_token,
                storeId: res.store_id,
                tableId: res.table_id,
                tableNumber: res.table_number,
            })
            message.success('로그인 성공!')
            navigate('/customer/menu')
        } catch (err: any) {
            message.error(err.detail || '로그인 실패')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 16 }}>
            <Card style={{ width: '100%', maxWidth: 400 }}>
                <Title level={3} style={{ textAlign: 'center' }}>테이블 설정</Title>
                <Form layout="vertical" onFinish={onFinish} data-testid="table-login-form">
                    <Form.Item name="store_id" label="매장 ID" rules={[{ required: true, message: '매장 ID를 입력하세요' }]}>
                        <Input data-testid="table-login-store-id" />
                    </Form.Item>
                    <Form.Item name="table_number" label="테이블 번호" rules={[{ required: true, message: '테이블 번호를 입력하세요' }]}>
                        <Input type="number" data-testid="table-login-table-number" />
                    </Form.Item>
                    <Form.Item name="password" label="비밀번호" rules={[{ required: true, message: '비밀번호를 입력하세요' }]}>
                        <Input.Password data-testid="table-login-password" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block data-testid="table-login-submit">
                            로그인
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}
