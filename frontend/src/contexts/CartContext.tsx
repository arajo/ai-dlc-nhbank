import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

export interface CartItem {
    menuId: number
    name: string
    price: number
    quantity: number
    imageUrl?: string
}

interface CartState {
    items: CartItem[]
    total: number
}

type CartAction =
    | { type: 'ADD_ITEM'; item: Omit<CartItem, 'quantity'> }
    | { type: 'REMOVE_ITEM'; menuId: number }
    | { type: 'UPDATE_QUANTITY'; menuId: number; quantity: number }
    | { type: 'CLEAR' }
    | { type: 'LOAD'; items: CartItem[] }

function calcTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

function cartReducer(state: CartState, action: CartAction): CartState {
    let newItems: CartItem[]

    switch (action.type) {
        case 'ADD_ITEM': {
            const existing = state.items.find((i) => i.menuId === action.item.menuId)
            if (existing) {
                newItems = state.items.map((i) =>
                    i.menuId === action.item.menuId ? { ...i, quantity: i.quantity + 1 } : i,
                )
            } else {
                newItems = [...state.items, { ...action.item, quantity: 1 }]
            }
            return { items: newItems, total: calcTotal(newItems) }
        }
        case 'REMOVE_ITEM':
            newItems = state.items.filter((i) => i.menuId !== action.menuId)
            return { items: newItems, total: calcTotal(newItems) }
        case 'UPDATE_QUANTITY':
            if (action.quantity <= 0) {
                newItems = state.items.filter((i) => i.menuId !== action.menuId)
            } else {
                newItems = state.items.map((i) =>
                    i.menuId === action.menuId ? { ...i, quantity: action.quantity } : i,
                )
            }
            return { items: newItems, total: calcTotal(newItems) }
        case 'CLEAR':
            return { items: [], total: 0 }
        case 'LOAD':
            return { items: action.items, total: calcTotal(action.items) }
        default:
            return state
    }
}

const CART_STORAGE_KEY = 'cart_items'

const CartContext = createContext<{
    state: CartState
    dispatch: React.Dispatch<CartAction>
} | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
    const saved = localStorage.getItem(CART_STORAGE_KEY)
    const initial: CartState = saved
        ? { items: JSON.parse(saved), total: calcTotal(JSON.parse(saved)) }
        : { items: [], total: 0 }

    const [state, dispatch] = useReducer(cartReducer, initial)

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
    }, [state.items])

    return (
        <CartContext.Provider value={{ state, dispatch }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) throw new Error('useCart must be used within CartProvider')
    return context
}
