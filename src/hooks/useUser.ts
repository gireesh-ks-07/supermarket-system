import useSWR from 'swr'

type User = {
    id: string
    username: string
    name: string
    role: 'ADMIN' | 'STOCK_MANAGER' | 'BILLING_STAFF'
    supermarketId: string
}

const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) {
        throw new Error('Failed to fetch user')
    }
    return res.json()
}

export function useUser() {
    const { data: user, error, isLoading } = useSWR<User>('/api/auth/me', fetcher, {
        shouldRetryOnError: false,
        revalidateOnFocus: false
    })

    return {
        user,
        isLoading,
        isError: error,
        isAdmin: user?.role === 'ADMIN',
        isManager: user?.role === 'STOCK_MANAGER',
        isCashier: user?.role === 'BILLING_STAFF',

        // Permissions
        canManageUsers: user?.role === 'ADMIN',
        canManageStock: user?.role === 'ADMIN' || user?.role === 'STOCK_MANAGER',
        canEdit: user?.role === 'ADMIN' || user?.role === 'STOCK_MANAGER',
        canDelete: user?.role === 'ADMIN' // Only Admin can delete usually
    }
}
