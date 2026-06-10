import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { DatasetProvider } from "@/lib/dataset-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Erro ao carregar</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex gap-2 justify-center">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
            Tentar de novo
          </button>
          <a href="/" className="rounded-md border px-4 py-2 text-sm">Início</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AlgoLab — Visualizador de Algoritmos" },
      { name: "description", content: "Ferramenta didática interativa para visualizar e comparar algoritmos de ordenação e busca." },
      { property: "og:title", content: "AlgoLab — Visualizador de Algoritmos" },
      { name: "twitter:title", content: "AlgoLab — Visualizador de Algoritmos" },
      { property: "og:description", content: "Ferramenta didática interativa para visualizar e comparar algoritmos de ordenação e busca." },
      { name: "twitter:description", content: "Ferramenta didática interativa para visualizar e comparar algoritmos de ordenação e busca." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/90e72339-9d0e-4ac1-8a8d-9af33f700dcf/id-preview-b5bf71c7--7accf44f-7e61-4660-98a6-aee6fdc71c34.lovable.app-1781053827415.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/90e72339-9d0e-4ac1-8a8d-9af33f700dcf/id-preview-b5bf71c7--7accf44f-7e61-4660-98a6-aee6fdc71c34.lovable.app-1781053827415.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-primary text-primary-foreground" }}
      inactiveProps={{ className: "hover:bg-accent" }}
      activeOptions={{ exact: true }}
      className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
    >
      {label}
    </Link>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <DatasetProvider>
        <div className="min-h-screen flex flex-col">
          <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
              <Link to="/" className="font-bold text-lg">
                <span className="bg-gradient-to-r from-bar-pivot to-bar-compare-b bg-clip-text text-transparent">AlgoLab</span>
              </Link>
              <nav className="flex gap-1">
                <NavLink to="/" label="Início" />
                <NavLink to="/visualize" label="Visualizar" />
                <NavLink to="/compare" label="Comparar" />
                <NavLink to="/search" label="Buscar" />
              </nav>
            </div>
          </header>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
            <Outlet />
          </main>
        </div>
      </DatasetProvider>
    </QueryClientProvider>
  );
}
