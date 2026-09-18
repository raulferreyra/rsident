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
                    <span>CATÁLOGO</span>
                    <h1>{title}</h1>
                </div>
            </header>

            <form
                className="admin-catalog__form"
                onSubmit={handleSubmit}
            >
                <div>
                    <label htmlFor="catalog-name">
                        Nombre
                    </label>

                    <input
                        id="catalog-name"
                        value={name}
                        onChange={(event) => {
                            setName(event.target.value);
                        }}
                        placeholder={`Nueva ${title.toLowerCase()}`}
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                >
                    {saving
                        ? 'Guardando...'
                        : editingID
                            ? 'Actualizar'
                            : 'Agregar'}
                </button>

                {editingID && (
                    <button
                        type="button"
                        onClick={handleCancel}
                    >
                        Cancelar
                    </button>
                )}
            </form>

            {error && (
                <p className="admin-catalog__error">
                    {error}
                </p>
            )}

            {loading ? (
                <p>Cargando...</p>
            ) : (
                <div className="admin-catalog__table">
                    <div className="admin-catalog__row admin-catalog__row--header">
                        <span>Nombre</span>
                        <span>Slug</span>
                        <span>Estado</span>
                        <span />
                    </div>

                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="admin-catalog__row"
                        >
                            <span>{item.name}</span>

                            <span>{item.slug}</span>

                            <span>
                                {item.active
                                    ? 'Activo'
                                    : 'Inactivo'}
                            </span>

                            <span className="admin-catalog__actions">
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleEdit(item);
                                    }}
                                >
                                    Editar
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        handleDelete(item.id);
                                    }}
                                >
                                    Eliminar
                                </button>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}