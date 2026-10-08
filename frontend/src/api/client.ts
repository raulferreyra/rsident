import { signOut } from 'firebase/auth';

import { auth } from '../config/firebase';

export const AUTH_ERROR_EVENT = 'rsident:auth-error';

const API_URL = (
    import.meta.env.VITE_API_URL ?? '/api'
).replace(/\/$/, '');

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);

        this.name = 'ApiError';
        this.status = status;
    }
}

function notifyAuthError() {
    window.dispatchEvent(
        new CustomEvent(AUTH_ERROR_EVENT),
    );
}

async function getToken(forceRefresh = false) {
    const user = auth.currentUser;

    if (!user) {
        throw new ApiError(
            'Usuario no autenticado',
            401,
        );
    }

    return user.getIdToken(forceRefresh);
}

async function parseError(
    response: Response,
    fallback: string,
) {
    const body = await response.json().catch(
        () => null,
    );

    return new ApiError(
        body?.error ?? fallback,
        response.status,
    );
}

async function request<T>(
    path: string,
    options: RequestInit = {},
    retry = true,
): Promise<T> {
    const token = await getToken();

    const response = await fetch(
        `${API_URL}${path}`,
        {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...options.headers,
            },
        },
    );

    if (response.status === 401 && retry) {
        const refreshedToken = await getToken(true);

        const retryResponse = await fetch(
            `${API_URL}${path}`,
            {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${refreshedToken}`,
                    ...options.headers,
                },
            },
        );

        if (!retryResponse.ok) {
            const error = await parseError(
                retryResponse,
                'Sesión inválida o expirada',
            );

            if (error.status === 401) {
                await signOut(auth);
                notifyAuthError();
            }

            throw error;
        }

        if (retryResponse.status === 204) {
            return undefined as T;
        }

        return retryResponse.json();
    }

    if (!response.ok) {
        const error = await parseError(
            response,
            'Error en la solicitud',
        );

        if (error.status === 401) {
            await signOut(auth);
            notifyAuthError();
        }

        throw error;
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

export async function uploadFile<T>(
    path: string,
    file: File,
): Promise<T> {
    const token = await getToken();

    const formData = new FormData();

    formData.append('file', file);

    const response = await fetch(
        `${API_URL}${path}`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        },
    );

    if (!response.ok) {
        const error = await parseError(
            response,
            'Error al subir el archivo',
        );

        if (error.status === 401) {
            await signOut(auth);
            notifyAuthError();
        }

        throw error;
    }

    return response.json();
}

export const api = {
    get: <T>(path: string) =>
        request<T>(path, {
            method: 'GET',
        }),

    post: <T>(path: string, body: unknown) =>
        request<T>(path, {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    put: <T>(path: string, body: unknown) =>
        request<T>(path, {
            method: 'PUT',
            body: JSON.stringify(body),
        }),

    delete: <T>(path: string) =>
        request<T>(path, {
            method: 'DELETE',
        }),

    getOrders: () =>
        request<Order[]>('/admin/orders', {
            method: 'GET',
        }),

    getOrder: (id: string) =>
        request<Order>(`/admin/orders/${id}`, {
            method: 'GET',
        }),

    approvePayment: (id: string) =>
        request<Order>(
            `/admin/orders/${id}/payment/approve`,
            {
                method: 'POST',
            },
        ),

    rejectPayment: (id: string) =>
        request<Order>(
            `/admin/orders/${id}/payment/reject`,
            {
                method: 'POST',
            },
        ),

    updateOrderStatus: (
        id: string,
        status: string,
    ) =>
        request<Order>(
            `/admin/orders/${id}/status`,
            {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            },
        ),

    updateReceiptStatus: (
        id: string,
        status: string,
    ) =>
        request<Order>(
            `/admin/orders/${id}/receipt-status`,
            {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            },
        ),
};

export const publicApi = {
    get: <T>(path: string) =>
        publicRequest<T>(path, {
            method: 'GET',
        }),
};

async function publicRequest<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw await parseError(
            response,
            'Error en la solicitud',
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

export async function publicUpload<T>(
    path: string,
    fields: Record<string, string>,
    file: File,
): Promise<T> {
    const formData = new FormData();

    Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
    });

    formData.append('paymentProof', file);

    const response = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw await parseError(
            response,
            'Error al procesar la solicitud',
        );
    }

    return response.json();
}

export async function lookupOrder(
    orderNumber: string,
    email: string,
) {
    return publicRequest<Order>(
        `/orders/lookup?orderNumber=${encodeURIComponent(
            orderNumber,
        )}&email=${encodeURIComponent(email)}`,
        {
            method: 'GET',
        },
    );
}