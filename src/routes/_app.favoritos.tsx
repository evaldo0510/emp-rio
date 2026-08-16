import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/favoritos")({
  head: () => ({ meta: [{ title: "Favoritos — Empório do Licuri" }] }),
  component: () => (
    <div className="container-narrow py-20 text-center">
      <Heart className="mx-auto h-10 w-10 text-[var(--clay)]" />
      <h1 className="mt-4 font-display text-3xl font-semibold">Sua lista de favoritos</h1>
      <p className="mt-2 text-[var(--muted-foreground)]">
        Salve produtos do licuri para revisitar depois.
      </p>
      <Button asChild variant="hero" className="mt-6">
        <Link to="/categorias">Explorar produtos</Link>
      </Button>
    </div>
  ),
});
