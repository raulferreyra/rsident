import { auth } from '../config/firebase';

const API_URL = 'http://localhost:8080/api';

async function request<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const user = auth.currentUser;

    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    const token = await user.getIdToken();

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

    if (!response.ok) {
        const body = await response.json().catch(() => null);

        throw new Error(
            body?.error ?? 'Error en la solicitud',
        );
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
    const user = auth.currentUser;

    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    const token = await user.getIdToken();

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const body = await response.json().catch(() => null);

        throw new Error(
            body?.error ?? 'Error al subir el archivo',
        );
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
};