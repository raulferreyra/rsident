import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api, uploadFile } from '../../api/client';

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
    colorId: string;
    size: string;
    sku: string;
    stock: number;

    // Compatibilidad con productos antiguos
    color?: string;
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
    images: ProductImage[];
    colors: ProductColor[];
    variants: ProductVariant[];
    published: boolean;
    featured: boolean;
    isNew: boolean;
}

interface UploadResponse {
    url: string;
}

interface ImageFileState {
    file: File | null;
    preview: string;
}

interface ColorFileState {
    file: File | null;
    preview: string;
}

const sizes = [
    'XS',
    'S',
    'M',
    'L',
    'XL',
    'XXL',
];

const BACKEND_URL = 'http://localhost:8080';

const emptyProduct: Product = {
    name: '',
    slug: '',
    description: '',
    price: 0,
    oldPrice: 0,
    categoryId: '',
    collectionId: '',
    tagIds: [],
    images: [],
    colors: [],
    variants: [],
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

function getImageURL(url: string) {
    if (!url) {
        return '';
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    return `${BACKEND_URL}${url}`;
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

    const [imageFiles, setImageFiles] =
        useState<ImageFileState[]>([
            { file: null, preview: '' },
            { file: null, preview: '' },
            { file: null, preview: '' },
            { file: null, preview: '' },
        ]);

    const [colorFiles, setColorFiles] =
        useState<Record<string, ColorFileState>>({});

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

        const normalizedColors =
            result.colors ?? [];

        const normalizedVariants =
            (result.variants ?? []).map(
                (variant) => {
                    if (variant.colorId) {
                        return variant;
                    }

                    const matchingColor =
                        normalizedColors.find(
                            (color) =>
                                color.name ===
                                variant.color,
                        );

                    return {
                        ...variant,
                        colorId:
                            matchingColor?.id ?? '',
                    };
                },
            );

        setProduct({
            ...result,
            images: result.images ?? [],
            colors: normalizedColors,
            variants: normalizedVariants,
            tagIds: result.tagIds ?? [],
        });

        const existingImages =
            result.images ?? [];

        setImageFiles(
            [0, 1, 2, 3].map((index) => {
                const image =
                    existingImages[index];

                return {
                    file: null,
                    preview: image
                        ? getImageURL(image.url)
                        : '',
                };
            }),
        );

        const existingColorFiles: Record<
            string,
            ColorFileState
        > = {};

        normalizedColors.forEach((color) => {
            existingColorFiles[color.id] = {
                file: null,
                preview: color.imageUrl
                    ? getImageURL(color.imageUrl)
                    : '',
            };
        });

        setColorFiles(existingColorFiles);
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

    const updateImageFile = (
        index: number,
        file: File | null,
    ) => {
        if (!file) {
            return;
        }

        const preview =
            URL.createObjectURL(file);

        setImageFiles((current) =>
            current.map((image, imageIndex) =>
                imageIndex === index
                    ? {
                        file,
                        preview,
                    }
                    : image,
            ),
        );
    };

    const removeImage = (index: number) => {
        setImageFiles((current) =>
            current.map((image, imageIndex) =>
                imageIndex === index
                    ? {
                        file: null,
                        preview: '',
                    }
                    : image,
            ),
        );

        updateProduct({
            images: product.images.filter(
                (_, imageIndex) =>
                    imageIndex !== index,
            ).map((image, imageIndex) => ({
                ...image,
                order: imageIndex + 1,
            })),
        });
    };

    const updateImageAlt = (
        index: number,
        alt: string,
    ) => {
        const images = [...product.images];

        const existingImage = images[index];

        if (!existingImage) {
            images[index] = {
                url: '',
                alt,
                order: index + 1,
            };
        } else {
            images[index] = {
                ...existingImage,
                alt,
            };
        }

        updateProduct({
            images,
        });
    };

    const addColor = () => {
        const colorID =
            crypto.randomUUID();

        updateProduct({
            colors: [
                ...product.colors,
                {
                    id: colorID,
                    name: '',
                    imageUrl: '',
                    images: [],
                },
            ],
        });

        setColorFiles((current) => ({
            ...current,
            [colorID]: {
                file: null,
                preview: '',
            },
        }));
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

    const updateColorFile = (
        colorID: string,
        file: File | null,
    ) => {
        if (!file) {
            return;
        }

        const preview =
            URL.createObjectURL(file);

        setColorFiles((current) => ({
            ...current,
            [colorID]: {
                file,
                preview,
            },
        }));
    };

    const removeColor = (index: number) => {
        const color =
            product.colors[index];

        if (!color) {
            return;
        }

        updateProduct({
            colors: product.colors.filter(
                (_, colorIndex) =>
                    colorIndex !== index,
            ),
            variants: product.variants.filter(
                (variant) =>
                    variant.colorId !==
                    color.id,
            ),
        });

        setColorFiles((current) => {
            const next = {
                ...current,
            };

            delete next[color.id];

            return next;
        });
    };

    const getVariant = (
        colorID: string,
        size: string,
    ) => {
        return product.variants.find(
            (variant) =>
                variant.colorId === colorID &&
                variant.size === size,
        );
    };

    const updateVariantStock = (
        colorID: string,
        size: string,
        stock: number,
    ) => {
        const existing = getVariant(
            colorID,
            size,
        );

        if (existing) {
            updateProduct({
                variants:
                    product.variants.map(
                        (variant) =>
                            variant.id ===
                                existing.id
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
                    colorId: colorID,
                    size,
                    sku: '',
                    stock,
                },
            ],
        });
    };

    const toggleTag = (tagID: string) => {
        const exists =
            product.tagIds.includes(tagID);

        updateProduct({
            tagIds: exists
                ? product.tagIds.filter(
                    (id) => id !== tagID,
                )
                : [
                    ...product.tagIds,
                    tagID,
                ],
        });
    };

    const uploadProductImage = async (
        productID: string,
        file: File,
    ) => {
        const result =
            await uploadFile<UploadResponse>(
                `/admin/products/${productID}/images`,
                file,
            );

        return result.url;
    };

    const buildPayload = (
        images: ProductImage[],
        colors: ProductColor[],
    ) => {
        return {
            name: product.name.trim(),
            slug:
                product.slug.trim() ||
                createSlug(product.name),
            description: product.description,
            price: Number(product.price),
            oldPrice: Number(product.oldPrice),
            categoryId: product.categoryId,
            collectionId:
                product.collectionId,
            tagIds: product.tagIds,
            images,
            colors,
            variants: product.variants.map(
                (variant) => ({
                    id: variant.id,
                    colorId: variant.colorId,
                    size: variant.size,
                    sku: variant.sku,
                    stock: Number(
                        variant.stock,
                    ),
                }),
            ),
            published: product.published,
            featured: product.featured,
            isNew: product.isNew,
        };
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setSaving(true);
        setError('');

        let createdProductID = '';

        try {
            if (!product.name.trim()) {
                throw new Error(
                    'El nombre del producto es obligatorio',
                );
            }

            const slug =
                product.slug.trim() ||
                createSlug(product.name);

            if (!slug) {
                throw new Error(
                    'El slug del producto es obligatorio',
                );
            }

            const initialImages =
                product.images.filter(
                    (image) => image.url,
                );

            const initialColors =
                product.colors.map(
                    (color) => ({
                        id: color.id,
                        name: color.name,
                        imageUrl:
                            color.imageUrl,
                        images:
                            color.images ?? [],
                    }),
                );

            let productID = id;

            if (!productID) {
                const created =
                    await api.post<Product>(
                        '/admin/products',
                        buildPayload(
                            initialImages,
                            initialColors,
                        ),
                    );

                productID = created.id;

                if (!productID) {
                    throw new Error(
                        'El producto fue creado pero no se recibió su ID',
                    );
                }

                createdProductID = productID;
            }

            const uploadedImages: ProductImage[] =
                [];

            for (
                let index = 0;
                index < 4;
                index++
            ) {
                const file =
                    imageFiles[index]?.file;

                const existingImage =
                    product.images[index];

                let imageURL =
                    existingImage?.url ?? '';

                if (file) {
                    imageURL =
                        await uploadProductImage(
                            productID,
                            file,
                        );
                }

                if (imageURL) {
                    uploadedImages.push({
                        url: imageURL,
                        alt:
                            existingImage?.alt ??
                            product.name,
                        order:
                            uploadedImages.length +
                            1,
                    });
                }
            }

            const uploadedColors: ProductColor[] =
                [];

            for (
                const color of product.colors
            ) {
                const colorFile =
                    colorFiles[color.id]?.file;

                let imageURL =
                    color.imageUrl;

                if (colorFile) {
                    imageURL =
                        await uploadProductImage(
                            productID,
                            colorFile,
                        );
                }

                uploadedColors.push({
                    id: color.id,
                    name: color.name,
                    imageUrl: imageURL,
                    images:
                        color.images ?? [],
                });
            }

            const finalPayload =
                buildPayload(
                    uploadedImages,
                    uploadedColors,
                );

            await api.put(
                `/admin/products/${productID}`,
                finalPayload,
            );

            navigate('/admin/products');
        } catch (err) {
            if (createdProductID) {
                try {
                    await api.delete(
                        `/admin/products/${createdProductID}`,
                    );
                } catch {
                    // No reemplazar el error original
                }
            }

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
                                value={
                                    product.categoryId
                                }
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

                                {categories.map(
                                    (category) => (
                                        <option
                                            key={
                                                category.id
                                            }
                                            value={
                                                category.id
                                            }
                                        >
                                            {
                                                category.name
                                            }
                                        </option>
                                    ),
                                )}
                            </select>
                        </label>

                        <label>
                            Colección

                            <select
                                value={
                                    product.collectionId
                                }
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
                                            key={
                                                collection.id
                                            }
                                            value={
                                                collection.id
                                            }
                                        >
                                            {
                                                collection.name
                                            }
                                        </option>
                                    ),
                                )}
                            </select>
                        </label>

                        <label className="admin-product-form__full">
                            Descripción

                            <textarea
                                rows={6}
                                value={
                                    product.description
                                }
                                onChange={(event) => {
                                    updateProduct({
                                        description:
                                            event.target
                                                .value,
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
                                        toggleTag(
                                            tag.id,
                                        );
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
                    </div>

                    <div className="admin-product-form__images">
                        {[0, 1, 2, 3].map(
                            (index) => {
                                const image =
                                    product.images[
                                    index
                                    ];

                                const fileState =
                                    imageFiles[
                                    index
                                    ];

                                return (
                                    <div
                                        key={index}
                                        className="admin-product-form__image"
                                    >
                                        <strong>
                                            Foto{' '}
                                            {index +
                                                1}
                                        </strong>

                                        {fileState
                                            ?.preview ||
                                            image?.url ? (
                                            <img
                                                src={
                                                    fileState?.preview ||
                                                    getImageURL(
                                                        image?.url ??
                                                        '',
                                                    )
                                                }
                                                alt={
                                                    image?.alt ||
                                                    `Foto ${index +
                                                    1
                                                    }`
                                                }
                                            />
                                        ) : (
                                            <span>
                                                Sin fotografía
                                            </span>
                                        )}

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(
                                                event,
                                            ) => {
                                                updateImageFile(
                                                    index,
                                                    event
                                                        .target
                                                        .files?.[0] ??
                                                    null,
                                                );
                                            }}
                                        />

                                        <input
                                            value={
                                                image?.alt ??
                                                ''
                                            }
                                            onChange={(
                                                event,
                                            ) => {
                                                updateImageAlt(
                                                    index,
                                                    event
                                                        .target
                                                        .value,
                                                );
                                            }}
                                            placeholder="Texto alternativo"
                                        />

                                        {(fileState
                                            ?.preview ||
                                            image?.url) && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeImage(
                                                            index,
                                                        )
                                                    }
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                    </div>
                                );
                            },
                        )}
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
                            (color, index) => {
                                const fileState =
                                    colorFiles[
                                    color.id
                                    ];

                                return (
                                    <div
                                        key={
                                            color.id
                                        }
                                        className="admin-product-form__color"
                                    >
                                        <label>
                                            Nombre

                                            <input
                                                value={
                                                    color.name
                                                }
                                                onChange={(
                                                    event,
                                                ) => {
                                                    updateColor(
                                                        index,
                                                        {
                                                            name: event
                                                                .target
                                                                .value,
                                                        },
                                                    );
                                                }}
                                            />
                                        </label>

                                        <label>
                                            Imagen representativa

                                            {fileState
                                                ?.preview ||
                                                color.imageUrl ? (
                                                <img
                                                    src={
                                                        fileState?.preview ||
                                                        getImageURL(
                                                            color.imageUrl,
                                                        )
                                                    }
                                                    alt={
                                                        color.name ||
                                                        'Color'
                                                    }
                                                />
                                            ) : (
                                                <span>
                                                    Sin imagen
                                                </span>
                                            )}

                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(
                                                    event,
                                                ) => {
                                                    updateColorFile(
                                                        color.id,
                                                        event
                                                            .target
                                                            .files?.[0] ??
                                                        null,
                                                    );
                                                }}
                                            />
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                removeColor(
                                                    index,
                                                );
                                            }}
                                        >
                                            Eliminar color
                                        </button>
                                    </div>
                                );
                            },
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
                                <h3>
                                    {color.name ||
                                        'Color'}
                                </h3>

                                <div className="admin-product-form__stock-grid">
                                    {sizes.map(
                                        (size) => {
                                            const variant =
                                                getVariant(
                                                    color.id,
                                                    size,
                                                );

                                            return (
                                                <label
                                                    key={
                                                        size
                                                    }
                                                >
                                                    <span>
                                                        {
                                                            size
                                                        }
                                                    </span>

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
                                                                color.id,
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
                                        },
                                    )}
                                </div>
                            </div>
                        ),
                    )}
                </section>

                <section className="admin-product-form__section">
                    <h2>Estado</h2>

                    <div className="admin-product-form__checks">
                        <label>
                            <input
                                type="checkbox"
                                checked={
                                    product.published
                                }
                                onChange={(event) => {
                                    updateProduct({
                                        published:
                                            event.target
                                                .checked,
                                    });
                                }}
                            />

                            Publicado
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={
                                    product.featured
                                }
                                onChange={(event) => {
                                    updateProduct({
                                        featured:
                                            event.target
                                                .checked,
                                    });
                                }}
                            />

                            Destacado
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={
                                    product.isNew
                                }
                                onChange={(event) => {
                                    updateProduct({
                                        isNew:
                                            event.target
                                                .checked,
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