import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { LicuriBrand } from "./brand";
import { useCart } from "@/lib/cart";

const nav = [
  { to: "/", label: "Início" },
  { to: "/categorias", label: "Categorias" },
  { to: "/lojas", label: "Lojas" },
  { to: "/sobre", label: "Sobre o Licuri" },
  { to: "/blog", label: "Blog" },
] as const;

export function SiteHeader() {
  const count = useCart((s) => s.items.reduce((a, i) => a + i.quantity, 0));
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)_88%,transparent)] backdrop-blur">
      <div className="container-narrow flex h-16 items-center gap-6">
        <Link to="/" className="shrink-0">
          <LicuriBrand />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm text-[var(--sertao)] transition-colors hover:text-[var(--clay)]"
              activeProps={{ className: "text-[var(--clay)] font-medium" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/categorias", search: { q } as never });
          }}
          className="ml-auto hidden flex-1 max-w-sm items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--cream)] px-4 py-2 lg:flex"
        >
          <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produtos..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <Link
            to="/conta"
            className="grid h-9 w-9 place-items-center rounded-full text-[var(--sertao)] hover:bg-[var(--cream)]"
            aria-label="Conta"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            to="/favoritos"
            className="grid h-9 w-9 place-items-center rounded-full text-[var(--sertao)] hover:bg-[var(--cream)]"
            aria-label="Favoritos"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            to="/carrinho"
            className="relative grid h-9 w-9 place-items-center rounded-full text-[var(--sertao)] hover:bg-[var(--cream)]"
            aria-label="Carrinho"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--clay)] px-1 text-[10px] font-semibold text-[var(--clay-foreground)]">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-[var(--cream)]">
      <div className="container-narrow grid gap-10 py-14 md:grid-cols-4">
        <div>
          <LicuriBrand />
          <p className="mt-4 max-w-xs text-sm text-[var(--muted-foreground)]">
            Marketplace de produtos do licuri, feitos por famílias e cooperativas do Nordeste
            brasileiro.
          </p>
        </div>
        <FooterCol
          title="Loja"
          links={[
            ["/categorias", "Todos os produtos"],
            ["/lojas", "Lojas parceiras"],
            ["/categorias", "Categorias"],
          ]}
        />
        <FooterCol
          title="Sobre"
          links={[
            ["/sobre", "Nossa história"],
            ["/blog", "Blog"],
            ["/sobre", "Sustentabilidade"],
          ]}
        />
        <FooterCol
          title="Vendedores"
          links={[
            ["/vendedor", "Painel do vendedor"],
            ["/admin", "Painel admin"],
            ["/conta", "Minha conta"],
          ]}
        />
      </div>
      <div className="border-t border-[var(--border)]">
        <div className="container-narrow flex flex-col items-center justify-between gap-2 py-5 text-xs text-[var(--muted-foreground)] md:flex-row">
          <p>© {new Date().getFullYear()} Licuri Hub — Raízes que alimentam.</p>
          <p>Feito com cuidado no Sertão.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-3 font-display text-base font-semibold text-[var(--coffee)]">{title}</h4>
      <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
        {links.map(([to, label]) => (
          <li key={to + label}>
            <Link to={to} className="hover:text-[var(--clay)]">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
