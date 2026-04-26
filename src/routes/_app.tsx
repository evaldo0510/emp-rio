import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
      <Toaster richColors position="top-right" />
    </div>
  );
}

