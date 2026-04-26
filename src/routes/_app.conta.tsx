import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/conta")({
  head: () => ({ meta: [{ title: "Minha conta — Licuri Hub" }] }),
  component: AccountPage,
});

function AccountPage() {
  return (
    <div className="container-narrow py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
        <h1 className="font-display text-3xl font-semibold text-[var(--coffee)]">Entrar</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Acesse sua conta para acompanhar pedidos e favoritos.
        </p>
        <form className="mt-6 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--muted-foreground)]">E-mail</span>
            <input
              type="email"
              placeholder="seu@email.com"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 outline-none focus:border-[var(--clay)]"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--muted-foreground)]">Senha</span>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 outline-none focus:border-[var(--clay)]"
            />
          </label>
          <Button type="button" variant="hero" size="lg" className="w-full">
            Entrar
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
          O backend (login real, banco de dados, painéis) será ativado na próxima fase com Lovable Cloud.
          Por enquanto,{" "}
          <Link to="/" className="text-[var(--clay)] underline">
            voltar à loja
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
