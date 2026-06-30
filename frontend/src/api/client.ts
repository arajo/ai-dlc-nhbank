/**
 * Fetch API wrapper with base URL, auth headers, and error handling.
 */

const BASE_URL = '/api'
const TIMEOUT_MS = 10000

export class ApiError extends Error {
    constructor(
        public status: number,
        public detail: string,
    ) {
        super(detail)
        this.name = 'ApiError'
    }
}

function getAuthToken(): string | null {
    return localStorage.getItem('token')
}

async function request<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const token = getAuthToken()
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
        const response = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers,
            signal: controller.signal,
        })

        if (!response.ok) {
            const body = await response.json().catch(() => ({ detail: 'Unknown error' }))
            throw new ApiError(response.status, body.detail || `HTTP ${response.status}`)
        }

        if (response.status === 204) {
            return undefined as T
        }

        return response.json()
    } finally {
        clearTimeout(timeout)
    }
}

export const api = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    put: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
