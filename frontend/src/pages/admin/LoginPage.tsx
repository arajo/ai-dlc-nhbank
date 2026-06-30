import { useState } from 'react'
import { Form, Input, Button, Card, message, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../api/client'

const { Title } = Typography

export default function AdminLoginPage() {
    const [loading, setLoading] = useState(false)
    const { dispatch } = useAuth()
    const navigate = useNavigate()

    const onFinish = async (values: { store_id: string; username: string; password: string }) => {
        setLoading(true)
        try {
            const res = await api.post<{ access_token: string }>('/auth/admin/login', values)
            dispatch({ type: 'LOGIN_ADMIN', token: res.access_token, storeId: values.store_id })
            message.success('관리자 로그인 성공!')
            navigate('/admin/dashboard')
        } catch (err: any) {
            message.error(err.detail || '로그인 실패')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 16 }}>
            <Card style={{ width: '100%', maxWidth: 400 }}>
                <Title level={3} style={{ textAlign: 'center' }}>관리자 로그인</Title>
                <Form layout="vertical" onFinish={onFinish} data-testid="admin-login-form">
                    <Form.Item name="store_id" label="매장 ID" rules={[{ required: true }]}>
                        <Input data-testid="admin-login-store-id" />
                    </Form.Item>
                    <Form.Item name="username" label="사용자명" rules={[{ required: true }]}>
                        <Input data-testid="admin-login-username" />
                    </Form.Item>
                    <Form.Item name="password" label="비밀번호" rules={[{ required: true }]}>
                        <Input.Password data-testid="admin-login-password" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block data-testid="admin-login-submit">
                            로그인
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}
