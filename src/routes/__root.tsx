import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { I18nProvider } from "@/lib/i18n";
import { PixelProvider } from "@/lib/pixels";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-gradient-gold">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">Cette page n'existe pas ou a été déplacée.</p>
        <a href="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-gradient-gold px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-display font-semibold text-foreground">Une erreur est survenue</h1>
        <p className="mt-2 text-sm text-muted-foreground">Veuillez réessayer ou revenir à l'accueil.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-gradient-gold px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            Réessayer
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-surface">
            Accueil
          </a>
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
      { title: "Malak Digital — Boutique en ligne premium en Algérie" },
      { name: "description", content: "Malak Digital, la boutique en ligne premium d'Algérie. Paiement à la livraison dans les 69 wilayas." },
      { name: "author", content: "Malak Digital" },
      { property: "og:title", content: "Malak Digital — Boutique en ligne premium en Algérie" },
      { property: "og:description", content: "Malak Digital, la boutique en ligne premium d'Algérie. Paiement à la livraison dans les 69 wilayas." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Malak Digital" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0e0e15" },
      { name: "twitter:title", content: "Malak Digital — Boutique en ligne premium en Algérie" },
      { name: "twitter:description", content: "Malak Digital, la boutique en ligne premium d'Algérie. Paiement à la livraison dans les 69 wilayas." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a19ef41e-78d4-4e33-9723-89584ccabecc/id-preview-0c9d20fb--2a836d99-4ab3-4f4a-945a-7a66187b8164.lovable.app-1782990401535.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a19ef41e-78d4-4e33-9723-89584ccabecc/id-preview-0c9d20fb--2a836d99-4ab3-4f4a-945a-7a66187b8164.lovable.app-1782990401535.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&family=Tajawal:wght@400;500;700&family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <PixelProvider>
          <Outlet />
          <Toaster />
        </PixelProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
