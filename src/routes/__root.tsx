import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Empório do Licuri — Natural, Tradição e Energia" },
      {
        name: "description",
        content:
          "Marketplace de produtos do licuri feitos por famílias e cooperativas do Nordeste brasileiro. Alimentos, óleos, cosméticos e artesanato.",
      },
      { name: "author", content: "Empório do Licuri" },
      { property: "og:title", content: "Empório do Licuri — Natural, Tradição e Energia" },
      {
        property: "og:description",
        content: "Produtos artesanais do licuri direto do Sertão para sua casa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Empório do Licuri — Natural, Tradição e Energia" },
      { name: "description", content: "A multi-vendor marketplace application enabling sellers to list products, manage orders, and track finances." },
      { property: "og:description", content: "A multi-vendor marketplace application enabling sellers to list products, manage orders, and track finances." },
      { name: "twitter:description", content: "A multi-vendor marketplace application enabling sellers to list products, manage orders, and track finances." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/45033d70-006e-4892-865c-ccb0b99a9764/id-preview-a42c885f--802510c5-e9ec-4a7c-ac70-999ef9b33269.lovable.app-1782439931272.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/45033d70-006e-4892-865c-ccb0b99a9764/id-preview-a42c885f--802510c5-e9ec-4a7c-ac70-999ef9b33269.lovable.app-1782439931272.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Inter:wght@300;400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],


  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
