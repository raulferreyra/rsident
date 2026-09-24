import type { Product } from '../types';
import ProductCard from './ProductCard';
import './ProductGrid.css';

interface ProductGridProps {
    products: Product[];
    emptyMessage?: string;
}

export default function ProductGrid({
    products,
    emptyMessage = 'No hay productos disponibles.',
}: ProductGridProps) {
    if (products.length === 0) {
        return (
            <p className="product-grid__empty">
                {emptyMessage}
            </p>
        );
    }

    return (
        <div className="product-grid">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                />
            ))}
        </div>
    );
}
