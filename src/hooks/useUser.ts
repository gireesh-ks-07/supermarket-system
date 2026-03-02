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
        isAdmin: user?.role?.toUpperCase() === 'ADMIN',
        isManager: user?.role?.toUpperCase() === 'STOCK_MANAGER',
        isCashier: user?.role?.toUpperCase() === 'BILLING_STAFF',

        // Permissions
        canManageUsers: user?.role?.toUpperCase() === 'ADMIN',
        canManageStock: user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'STOCK_MANAGER',
        canEdit: user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'STOCK_MANAGER',
        canDelete: user?.role?.toUpperCase() === 'ADMIN' // Only Admin can delete usually
    }
}
