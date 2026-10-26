import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { CatalogItem, HomeBanner, HomeConfig, Product } from '../../types';
import './Home.css';
const emptyBanner: HomeBanner = { mediaUrl: '', mediaType: 'image', title: '', buttonText: '', linkType: 'filter', linkTarget: 'descuentos' };
export default function HomeAdmin() {
    const [cfg, setCfg] = useState<HomeConfig>({ banners: [{ ...emptyBanner }], message: '', bestSellerIds: [] }); const [products, setProducts] = useState<Product[]>([]); const [categories, setCategories] = useState<CatalogItem[]>([]); const [collections, setCollections] = useState<CatalogItem[]>([]); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
    useEffect(() => { Promise.all([api.get<HomeConfig>('/admin/home'), api.get<Product[]>('/admin/products'), api.get<CatalogItem[]>('/admin/catalog/categories'), api.get<CatalogItem[]>('/admin/catalog/collections')]).then(([home, items, cats, cols]) => { setCategories(cats); setCollections(cols); setCfg({ ...home, banners: home.banners?.length ? home.banners : [{ ...emptyBanner }], bestSellerIds: home.bestSellerIds ?? [] }); setProducts(items) }).catch(e => setError(e instanceof Error ? e.message : 'No se pudo cargar Home')) }, []);
    const uploadMedia = async (i: number, file: File) => { setError(''); try { const result = await api.uploadFile<{ url: string; mediaType: 'image' | 'video' }>('/admin/home/media', file); updateBanner(i, { mediaUrl: result.url, mediaType: result.mediaType }); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo subir el medio') } };
    const updateBanner = (i: number, patch: Partial<HomeBanner>) => setCfg(c => ({ ...c, banners: c.banners.map((b, n) => n === i ? { ...b, ...patch } : b) }));
    const save = async () => { setSaving(true); setError(''); setMessage(''); try { await api.put('/admin/home', { ...cfg, banners: cfg.banners.filter(b => b.mediaUrl.trim()) }); setMessage('Configuración del Home guardada.') } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar') } finally { setSaving(false) } };
    const toggleProduct = (id: string) => setCfg(c => ({ ...c, bestSellerIds: c.bestSellerIds.includes(id) ? c.bestSellerIds.filter(v => v !== id) : c.bestSellerIds.length < 8 ? [...c.bestSellerIds, id] : c.bestSellerIds }));
    return <main className="admin-home"><header><h1>Home</h1><p>Configura los banners, el mensaje y los productos más vendidos.</p></header>
        <section>
            <h2>Banner (máximo 3)</h2>
            <p>Sube JPG, PNG, WEBP, MP4 o WEBM (máximo 50 MB), o introduce una URL pública.</p>
            {cfg.banners.map((b, i) => <div className="admin-home__banner" key={i}>
                <h3>Banner {i + 1}</h3>
                <label>Subir imagen o vídeo
                    <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={e => { const file = e.target.files?.[0]; if (file) void uploadMedia(i, file) }} />
                </label>
                <label>URL de imagen o vídeo
                    <input value={b.mediaUrl} onChange={e => updateBanner(i, { mediaUrl: e.target.value })} placeholder="https://..." />
                </label>
                <label>
                    Tipo
                    <select value={b.mediaType} onChange={e => updateBanner(i, { mediaType: e.target.value as HomeBanner['mediaType'] })}>
                        <option value="image">Imagen</option>
                        <option value="video">Vídeo</option>
                    </select>
                </label>
                <label>
                    Título
                    <input value={b.title} onChange={e => updateBanner(i, { title: e.target.value })} />
                </label>
                <label>
                    Texto del botón
                    <input value={b.buttonText} onChange={e => updateBanner(i, { buttonText: e.target.value })} />
                </label>
                <label>Destino
                    <select value={b.linkType} onChange={e => updateBanner(i, { linkType: e.target.value as HomeBanner['linkType'], linkTarget: '' })}>
                        <option value="product">Producto</option>
                        <option value="page">Página</option>
                        <option value="filter">Filtro</option>
                    </select>
                </label>
                <label>
                    Seleccionar destino
                    <select value={b.linkTarget} onChange={e => updateBanner(i, { linkTarget: e.target.value })}>
                        <option value="">Selecciona...</option>
                        {b.linkType === 'product' ? products.filter(p => p.published).map(
                            p =>
                                <option key={p.id} value={p.id}>{p.name}</option>) : (b.linkType === 'filter' ? [['descuentos', 'Descuentos'], ['nuevos', 'Nuevos'], ['mas-vendidos', 'Más vendidos'], ...categories.filter(c => c.active).map(c => [c.slug, c.name])] : [['/tienda', 'Tienda'], ['/colecciones', 'Colecciones'], ...collections.filter(c => c.active).map(c => [`/colecciones/${c.slug}`, c.name]), ['/carrito', 'Carrito']]).map(([v, label]) => <option key={v} value={v}>{label}</option>)
                        }
                    </select>
                </label>
                {cfg.banners.length > 1 && <button type="button" onClick={() => setCfg(c => ({ ...c, banners: c.banners.filter((_, n) => n !== i) }))}>Eliminar banner</button>}
            </div>)}{cfg.banners.length < 3 && <button type="button" onClick={() => setCfg(c => ({ ...c, banners: [...c.banners, { ...emptyBanner }] }))}>
                Agregar banner
            </button>}
        </section>
        <section>
            <h2>Mensaje</h2>
            <label>Texto del componente HomeMessage
                <textarea rows={4} value={cfg.message} onChange={e => setCfg(c => ({ ...c, message: e.target.value }))} /></label></section>
        <section>
            <h2>Más vendidos ({cfg.bestSellerIds.length}/8)</h2>
            <p>Selecciona hasta ocho productos. Esta selección se refleja en el Home.</p>
            <div className="admin-home__products">{products.map(p => <label key={p.id}><input type="checkbox" checked={cfg.bestSellerIds.includes(p.id)} disabled={!cfg.bestSellerIds.includes(p.id) && cfg.bestSellerIds.length >= 8} onChange={() => toggleProduct(p.id)} />{p.name}</label>)}</div></section>{error && <p className="admin-home__error">{error}</p>}{message && <p className="admin-home__success">{message}</p>}<button type="button" disabled={saving} onClick={save}>{saving ? 'Guardando...' : 'Guardar cambios'}</button></main>
}
