import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatBRL } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className="group block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
    >
      <div className="aspect-square overflow-hidden bg-[var(--sand)]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-1.5 p-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          {product.shop}
        </p>
        <h3 className="line-clamp-2 font-display text-base font-semibold leading-tight text-[var(--coffee)]">
          {product.name}
        </h3>
        <div className="flex items-center justify-between pt-1">
          <span className="font-display text-lg font-bold text-primary">
            {formatBRL(product.price)}
          </span>

          <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            {product.rating} <span className="opacity-60">({product.reviews})</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
