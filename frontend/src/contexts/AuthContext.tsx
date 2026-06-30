import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

interface AuthState {
    token: string | null
    type: 'admin' | 'table' | null
    storeId: string | null
    tableId: number | null
    tableNumber: number | null
    isAuthenticated: boolean
}

type AuthAction =
    | { type: 'LOGIN_TABLE'; token: string; storeId: string; tableId: number; tableNumber: number }
    | { type: 'LOGIN_ADMIN'; token: string; storeId: string }
    | { type: 'LOGOUT' }

const initialState: AuthState = {
    token: localStorage.getItem('token'),
    type: localStorage.getItem('authType') as 'admin' | 'table' | null,
    storeId: localStorage.getItem('storeId'),
    tableId: Number(localStorage.getItem('tableId')) || null,
    tableNumber: Number(localStorage.getItem('tableNumber')) || null,
    isAuthenticated: !!localStorage.getItem('token'),
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'LOGIN_TABLE':
            localStorage.setItem('token', action.token)
            localStorage.setItem('authType', 'table')
            localStorage.setItem('storeId', action.storeId)
            localStorage.setItem('tableId', String(action.tableId))
            localStorage.setItem('tableNumber', String(action.tableNumber))
            return {
                token: action.token,
                type: 'table',
                storeId: action.storeId,
                tableId: action.tableId,
                tableNumber: action.tableNumber,
                isAuthenticated: true,
            }
        case 'LOGIN_ADMIN':
            localStorage.setItem('token', action.token)
            localStorage.setItem('authType', 'admin')
            localStorage.setItem('storeId', action.storeId)
            return {
                token: action.token,
                type: 'admin',
                storeId: action.storeId,
                tableId: null,
                tableNumber: null,
                isAuthenticated: true,
            }
        case 'LOGOUT':
            localStorage.removeItem('token')
            localStorage.removeItem('authType')
            localStorage.removeItem('storeId')
            localStorage.removeItem('tableId')
            localStorage.removeItem('tableNumber')
            return { ...initialState, token: null, isAuthenticated: false, type: null, storeId: null, tableId: null, tableNumber: null }
        default:
            return state
    }
}

const AuthContext = createContext<{
    state: AuthState
    dispatch: React.Dispatch<AuthAction>
} | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, initialState)
    return (
        <AuthContext.Provider value={{ state, dispatch }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
