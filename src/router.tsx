import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { getCspNonce } from "./lib/security/nonce";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // 1 min — evita refetch a cada navegação
        gcTime: 5 * 60_000, // 5 min — mantém cache ativo
        refetchOnWindowFocus: false,
        retry: 1,
        // Os hooks usam getSupabaseBrowserClient(), que depende de import.meta.env
        // e de APIs do navegador; evita executar queries durante o SSR.
        enabled: typeof window !== "undefined",
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent", // só faz preload no hover/focus
    defaultPreloadStaleTime: 30_000, // 30s — evita refetch desnecessário no preload
    ssr: {
      nonce: getCspNonce(),
    },
  });

  return router;
};
