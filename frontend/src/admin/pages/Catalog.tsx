import { useEffect, useState } from 'react';

import { api } from '../../api/client';

import './Catalog.css';

type CatalogType =
    | 'categories'
    | 'collections'
    | 'tags';

interface CatalogItem {
    id: string;
    name: string;
    slug: string;
    active: boolean;
}

interface CatalogProps {
    type: CatalogType;
    title: string;
}

function createSlug(value: string) {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export default function Catalog({
    type,
    title,
}: CatalogProps) {
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [name, setName] = useState('');
    const [editingID, setEditingID] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const loadItems = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await api.get<CatalogItem[]>(
                `/admin/catalog/${type}`,
            );

            setItems(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudieron cargar los registros',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, [type]);

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (!name.trim()) {
            return;
        }

        setSaving(true);
        setError('');

        try {
            const body = {
                name: name.trim(),
                slug: createSlug(name),
                active: true,
            };

            if (editingID) {
                await api.put(
                    `/admin/catalog/${type}/${editingID}`,
                    body,
                );
            } else {
                await api.post(
                    `/admin/catalog/${type}`,
                    body,
                );
            }

            setName('');
            setEditingID('');

            await loadItems();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo guardar',
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item: CatalogItem) => {
        setEditingID(item.id);
        setName(item.name);
    };

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm(
            '¿Deseas eliminar este registro?',
        );

        if (!confirmed) {
            return;
        }

        try {
            await api.delete(
                `/admin/catalog/${type}/${id}`,
            );

            await loadItems();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo eliminar',
            );
        }
    };

    const handleCancel = () => {
        setEditingID('');
        setName('');
    };

    return (
        <main className="admin-catalog">
            <header className="admin-catalog__header">
                <div>
                    <h1>{title}</h1>
                    <p>
                        Gestiona los registros de {title.toLowerCase()}.
                    </p>
                </div>
            </header>

            <section className="admin-catalog__form">
                <form onSubmit={handleSubmit}>
                    <div className="admin-catalog__field">
                        <label htmlFor="catalog-name">
                            Nombre
                        </label>

                        <input
                            id="catalog-name"
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            placeholder={`Nombre de ${title.toLowerCase()}`}
                        />
                    </div>

                    <div className="admin-catalog__form-actions">
                        <button
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? 'Guardando...'
                                : editingID
                                    ? 'Actualizar'
                                    : 'Crear'}
                        </button>

                        {editingID && (
                            <button
                                type="button"
                                onClick={handleCancel}
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </section>

            {error && (
                <p className="admin-catalog__error">
                    {error}
                </p>
            )}

            <section className="admin-catalog__table-container">
                {loading ? (
                    <p>Cargando...</p>
                ) : items.length === 0 ? (
                    <p>No hay registros.</p>
                ) : (
                    <table className="admin-catalog__table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Slug</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.name}</td>

                                    <td>{item.slug}</td>

                                    <td>
                                        {item.active
                                            ? 'Activo'
                                            : 'Inactivo'}
                                    </td>

                                    <td>
                                        <div className="admin-catalog__actions">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleEdit(item)
                                                }
                                                className="admin-catalog__edit"
                                            >
                                                Editar
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(item.id)
                                                }
                                                className="admin-catalog__delete"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </main>
    );
}