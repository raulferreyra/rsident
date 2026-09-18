import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api } from '../../api/client';

import './ProductForm.css';

interface CatalogItem {
    id: string;
    name: string;
    slug: string;
    active: boolean;
}

interface ProductImage {
    url: string;
    alt: string;
    order: number;
}

interface ProductColor {
    id: string;
    name: string;
    imageUrl: string;
    images: ProductImage[];
}

interface ProductVariant {
    id: string;
    color: string;
    size: string;
    sku: string;
    stock: number;
}

interface Product {
    id?: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    oldPrice: number;
    categoryId: string;
    collectionId: string;
    tagIds: string[];
    referenceUrl: string;
    images: ProductImage[];
    colors: ProductColor[];
    variants: ProductVariant[];
    sizeChartUrl: string;
    published: boolean;
    featured: boolean;
    isNew: boolean;
}

const sizes = [
    'XS',
    'S',
    'M',
    'L',
    'XL',
    'XXL',
];

const emptyProduct: Product = {
    name: '',
    slug: '',
    description: '',
    price: 0,
    oldPrice: 0,
    categoryId: '',
    collectionId: '',
    tagIds: [],
    referenceUrl: '',
    images: [],
    colors: [],
    variants: [],
    sizeChartUrl: '',
    published: false,
    featured: false,
    isNew: false,
};

function createSlug(value: string) {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export default function ProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] =
        useState<Product>(emptyProduct);

    const [categories, setCategories] =
        useState<CatalogItem[]>([]);

    const [collections, setCollections] =
        useState<CatalogItem[]>([]);

    const [tags, setTags] =
        useState<CatalogItem[]>([]);

    const [loading, setLoading] = useState(
        Boolean(id),
    );

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const loadCatalog = async () => {
        const [
            categoriesResult,
            collectionsResult,
            tagsResult,
        ] = await Promise.all([
            api.get<CatalogItem[]>(
                '/admin/catalog/categories',
            ),
            api.get<CatalogItem[]>(
                '/admin/catalog/collections',
            ),
            api.get<CatalogItem[]>(
                '/admin/catalog/tags',
            ),
        ]);

        setCategories(categoriesResult);
        setCollections(collectionsResult);
        setTags(tagsResult);
    };

    const loadProduct = async () => {
        if (!id) {
            return;
        }

        const result = await api.get<Product>(
            `/admin/products/${id}`,
        );

        setProduct(result);
    };

    useEffect(() => {
        const load = async () => {
            try {
                await loadCatalog();
                await loadProduct();
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'No se pudo cargar el producto',
                );
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    const updateProduct = (
        changes: Partial<Product>,
    ) => {
        setProduct((current) => ({
            ...current,
            ...changes,
        }));
    };

    const addImage = () => {
        if (product.images.length >= 4) {
            return;
        }

        updateProduct({
            images: [
                ...product.images,
                {
                    url: '',
                    alt: '',
                    order: product.images.length + 1,
                },
            ],
        });
    };

    const updateImage = (
        index: number,
        changes: Partial<ProductImage>,
    ) => {
        const images = [...product.images];

        images[index] = {
            ...images[index],
            ...changes,
        };

        updateProduct({
            images,
        });
    };

    const removeImage = (index: number) => {
        const images = product.images.filter(
            (_, imageIndex) => imageIndex !== index,
        );

        updateProduct({
            images: images.map((image, imageIndex) => ({
                ...image,
                order: imageIndex + 1,
            })),
        });
    };

    const addColor = () => {
        updateProduct({
            colors: [
                ...product.colors,
                {
                    id: crypto.randomUUID(),
                    name: '',
                    imageUrl: '',
                    images: [],
                },
            ],
        });
    };

    const updateColor = (
        index: number,
        changes: Partial<ProductColor>,
    ) => {
        const colors = [...product.colors];

        colors[index] = {
            ...colors[index],
            ...changes,
        };

        updateProduct({
            colors,
        });
    };

    const removeColor = (index: number) => {
        updateProduct({
            colors: product.colors.filter(
                (_, colorIndex) => colorIndex !== index,
            ),
        });
    };

    const getVariant = (
        color: string,
        size: string,
    ) => {
        return product.variants.find(
            (variant) =>
                variant.color === color &&
                variant.size === size,
        );
    };

    const updateVariantStock = (
        color: string,
        size: string,
        stock: number,
    ) => {
        const existing = getVariant(
            color,
            size,
        );

        if (existing) {
            updateProduct({
                variants: product.variants.map(
                    (variant) =>
                        variant.id === existing.id
                            ? {
                                ...variant,
                                stock,
                            }
                            : variant,
                ),
            });

            return;
        }

        updateProduct({
            variants: [
                ...product.variants,
                {
                    id: crypto.randomUUID(),
                    color,
                    size,
                    sku: '',
                    stock,
                },
            ],
        });
    };

    const toggleTag = (tagID: string) => {
        const exists = product.tagIds.includes(tagID);

        updateProduct({
            tagIds: exists
                ? product.tagIds.filter(
                    (id) => id !== tagID,
                )
                : [...product.tagIds, tagID],
        });
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setSaving(true);
        setError('');

        try {
            const body = {
                ...product,
                slug:
                    product.slug ||
                    createSlug(product.name),
            };

            if (id) {
                await api.put(
                    `/admin/products/${id}`,
                    body,
                );
            } else {
                await api.post(
                    '/admin/products',
                    body,
                );
            }

            navigate('/admin/products');
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo guardar el producto',
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <main className="admin-product-form">
                <p>Cargando producto...</p>
            </main>
        );
    }

    return (
        <main className="admin-product-form">
            <header className="admin-product-form__header">
                <div>
                    <span>CATÁLOGO</span>

                    <h1>
                        {id
                            ? 'Editar producto'
                            : 'Nuevo producto'}
                    </h1>
                </div>
            </header>

            {error && (
                <p className="admin-product-form__error">
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit}>
                <section className="admin-product-form__section">
                    <h2>Información</h2>

                    <div className="admin-product-form__grid">
                        <label>
                            Nombre

                            <input
                                value={product.name}
                                onChange={(event) => {
                                    updateProduct({
                                        name: event.target.value,
                                    });
                                }}
                                required
                            />
                        </label>

                        <label>
                            Slug

                            <input
                                value={product.slug}
                                onChange={(event) => {
                                    updateProduct({
                                        slug: event.target.value,
                                    });
                                }}
                                placeholder={createSlug(
                                    product.name,
                                )}
                            />
                        </label>

                        <label>
                            Precio

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={product.price}
                                onChange={(event) => {
                                    updateProduct({
                                        price: Number(
                                            event.target.value,
                                        ),
                                    });
                                }}
                            />
                        </label>

                        <label>
                            Precio anterior

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={product.oldPrice}
                                onChange={(event) => {
                                    updateProduct({
                                        oldPrice: Number(
                                            event.target.value,
                                        ),
                                    });
                                }}
                            />
                        </label>

                        <label>
                            Categoría

                            <select
                                value={product.categoryId}
                                onChange={(event) => {
                                    updateProduct({
                                        categoryId:
                                            event.target.value,
                                    });
                                }}
                            >
                                <option value="">
                                    Seleccionar
                                </option>

                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Colección

                            <select
                                value={product.collectionId}
                                onChange={(event) => {
                                    updateProduct({
                                        collectionId:
                                            event.target.value,
                                    });
                                }}
                            >
                                <option value="">
                                    Seleccionar
                                </option>

                                {collections.map(
                                    (collection) => (
                                        <option
                                            key={collection.id}
                                            value={collection.id}
                                        >
                                            {collection.name}
                                        </option>
                                    ),
                                )}
                            </select>
                        </label>

                        <label className="admin-product-form__full">
                            Descripción

                            <textarea
                                rows={6}
                                value={product.description}
                                onChange={(event) => {
                                    updateProduct({
                                        description:
                                            event.target.value,
                                    });
                                }}
                            />
                        </label>

                        <label className="admin-product-form__full">
                            Link de referencia

                            <input
                                type="url"
                                value={product.referenceUrl}
                                onChange={(event) => {
                                    updateProduct({
                                        referenceUrl:
                                            event.target.value,
                                    });
                                }}
                            />
                        </label>
                    </div>
                </section>

                <section className="admin-product-form__section">
                    <h2>Etiquetas</h2>

                    <div className="admin-product-form__tags">
                        {tags.map((tag) => (
                            <label
                                key={tag.id}
                                className={
                                    product.tagIds.includes(
                                        tag.id,
                                    )
                                        ? 'admin-product-form__tag admin-product-form__tag--selected'
                                        : 'admin-product-form__tag'
                                }
                            >
                                <input
                                    type="checkbox"
                                    checked={product.tagIds.includes(
                                        tag.id,
                                    )}
                                    onChange={() => {
                                        toggleTag(tag.id);
                                    }}
                                />

                                {tag.name}
                            </label>
                        ))}
                    </div>
                </section>

                <section className="admin-product-form__section">
                    <div className="admin-product-form__section-header">
                        <h2>Fotografías</h2>

                        <button
                            type="button"
                            onClick={addImage}
                            disabled={
                                product.images.length >= 4
                            }
                        >
                            Agregar fotografía
                        </button>
                    </div>

                    <div className="admin-product-form__images">
                        {[0, 1, 2, 3].map((index) => {
                            const image =
                                product.images[index];

                            return (
                                <div
                                    key={index}
                                    className="admin-product-form__image"
                                >
                                    <strong>
                                        Foto {index + 1}
                                    </strong>

                                    {image ? (
                                        <>
                                            <input
                                                value={image.url}
                                                onChange={(event) => {
                                                    updateImage(
                                                        index,
                                                        {
                                                            url: event
                                                                .target.value,
                                                        },
                                                    );
                                                }}
                                                placeholder="URL de imagen"
                                            />

                                            <input
                                                value={image.alt}
                                                onChange={(event) => {
                                                    updateImage(
                                                        index,
                                                        {
                                                            alt: event
                                                                .target.value,
                                                        },
                                                    );
                                                }}
                                                placeholder="Texto alternativo"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    removeImage(index);
                                                }}
                                            >
                                                Eliminar
                                            </button>
                                        </>
                                    ) : (
                                        <span>
                                            Sin fotografía
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="admin-product-form__section">
                    <div className="admin-product-form__section-header">
                        <h2>Colores</h2>

                        <button
                            type="button"
                            onClick={addColor}
                        >
                            Agregar color
                        </button>
                    </div>

                    <div className="admin-product-form__colors">
                        {product.colors.map(
                            (color, index) => (
                                <div
                                    key={color.id}
                                    className="admin-product-form__color"
                                >
                                    <label>
                                        Nombre

                                        <input
                                            value={color.name}
                                            onChange={(event) => {
                                                updateColor(
                                                    index,
                                                    {
                                                        name: event
                                                            .target.value,
                                                    },
                                                );
                                            }}
                                        />
                                    </label>

                                    <label>
                                        Imagen representativa

                                        <input
                                            value={color.imageUrl}
                                            onChange={(event) => {
                                                updateColor(
                                                    index,
                                                    {
                                                        imageUrl:
                                                            event
                                                                .target
                                                                .value,
                                                    },
                                                );
                                            }}
                                            placeholder="URL de imagen"
                                        />
                                    </label>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            removeColor(index);
                                        }}
                                    >
                                        Eliminar color
                                    </button>
                                </div>
                            ),
                        )}
                    </div>
                </section>

                <section className="admin-product-form__section">
                    <h2>Stock y tallas</h2>

                    {product.colors.map(
                        (color) => (
                            <div
                                key={color.id}
                                className="admin-product-form__stock"
                            >
                                <h3>{color.name || 'Color'}</h3>

                                <div className="admin-product-form__stock-grid">
                                    {sizes.map((size) => {
                                        const variant =
                                            getVariant(
                                                color.name,
                                                size,
                                            );

                                        return (
                                            <label key={size}>
                                                <span>{size}</span>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={
                                                        variant?.stock ??
                                                        0
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) => {
                                                        updateVariantStock(
                                                            color.name,
                                                            size,
                                                            Number(
                                                                event
                                                                    .target
                                                                    .value,
                                                            ),
                                                        );
                                                    }}
                                                />
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ),
                    )}
                </section>

                <section className="admin-product-form__section">
                    <h2>Tabla de tallas</h2>

                    <label>
                        URL de la tabla

                        <input
                            type="url"
                            value={product.sizeChartUrl}
                            onChange={(event) => {
                                updateProduct({
                                    sizeChartUrl:
                                        event.target.value,
                                });
                            }}
                            placeholder="URL de imagen"
                        />
                    </label>
                </section>

                <section className="admin-product-form__section">
                    <h2>Estado</h2>

                    <div className="admin-product-form__checks">
                        <label>
                            <input
                                type="checkbox"
                                checked={product.published}
                                onChange={(event) => {
                                    updateProduct({
                                        published:
                                            event.target.checked,
                                    });
                                }}
                            />

                            Publicado
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={product.featured}
                                onChange={(event) => {
                                    updateProduct({
                                        featured:
                                            event.target.checked,
                                    });
                                }}
                            />

                            Destacado
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={product.isNew}
                                onChange={(event) => {
                                    updateProduct({
                                        isNew:
                                            event.target.checked,
                                    });
                                }}
                            />

                            Nuevo
                        </label>
                    </div>
                </section>

                <div className="admin-product-form__submit">
                    <button
                        type="submit"
                        disabled={saving}
                    >
                        {saving
                            ? 'Guardando...'
                            : 'Guardar producto'}
                    </button>
                </div>
            </form>
        </main>
    );
}