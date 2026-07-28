import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import netlify from "@netlify/vite-plugin-tanstack-start";
import { VitePWA } from "vite-plugin-pwa";
import type { Plugin, ResolvedConfig, Rollup } from "vite";

type MaybePromise<T> = T | Promise<T>;

function isSSRConfig(config: ResolvedConfig): boolean {
  return !!config.build.ssr;
}

// O TanStack Start executa o build do SSR antes do closeBundle do client.
// Sem esse wrapper, o vite-plugin-pwa sobrescreve sua configuração interna
// com a do SSR e não gera o sw.js no cliente. Issolamos configResolved e
// closeBundle para rodarem apenas no ambiente client.
function isolatePWAPluginForClient(plugin: Plugin): Plugin {
  const wrapped: Plugin = { ...plugin };

  if (plugin.configResolved) {
    const original = plugin.configResolved as (config: ResolvedConfig) => MaybePromise<void>;
    wrapped.configResolved = function (config: ResolvedConfig) {
      if (isSSRConfig(config)) return;
      return original.call(this, config);
    };
  }

  if (plugin.closeBundle) {
    const original = plugin.closeBundle;
    if (typeof original === "function") {
      wrapped.closeBundle = function (this: Rollup.PluginContext, error?: Error) {
        if (this.environment?.config?.build?.ssr) return;
        return (original as Rollup.ObjectHook<() => MaybePromise<void>>).call(this, error);
      };
    } else {
      const originalHandler = (
        original as {
          sequential?: boolean;
          order?: "pre" | "post" | null;
          handler: (this: Rollup.PluginContext, error?: Error) => MaybePromise<void>;
        }
      ).handler;
      wrapped.closeBundle = {
        sequential: original.sequential,
        order: original.order,
        handler(this: Rollup.PluginContext, error?: Error) {
          if (this.environment?.config?.build?.ssr) return;
          return originalHandler.call(this, error);
        },
      };
    }
  }

  return wrapped;
}

function clientOnlyPWA(options: Parameters<typeof VitePWA>[0]) {
  return VitePWA(options).map(isolatePWAPluginForClient);
}

// cloudflare: false — desativa o @cloudflare/vite-plugin injetado automaticamente
// pelo @lovable.dev/vite-tanstack-config, que gera código incompatível com o Netlify.
export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    server: { entry: "server" },
    autoCodeSplitting: true,
  },
  plugins: [
    netlify(),
    clientOnlyPWA({
      registerType: "autoUpdate",
      includeAssets: ["/images/logo-icon.svg", "/icons/apple-touch-icon.png"],
      manifest: {
        name: "ModulaAPP",
        short_name: "Modula",
        description: "ModulaAPP — A natureza cria nós transformamos",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        navigateFallback: "/",
        navigateFallbackDenylist: [/^\/api/, /^\/auth/],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("node_modules")) {
              if (id.includes("recharts")) return "recharts";
              if (id.includes("framer-motion")) return "framer-motion";
              if (id.includes("@radix-ui")) return "radix-ui";
              if (id.includes("react-hook-form") || id.includes("@hookform/resolvers"))
                return "forms";
              if (id.includes("@tanstack/react-router") || id.includes("@tanstack/router"))
                return "tanstack-router";
              if (id.includes("@tanstack/react-start") || id.includes("@tanstack/start"))
                return "tanstack-start";
              if (id.includes("@tanstack/react-query") || id.includes("@tanstack/query-core"))
                return "tanstack-query";
              if (id.includes("@supabase/supabase-js")) return "supabase";
              if (id.includes("react-dom")) return "react-dom";
              if (id.includes("react/") || id.includes("scheduler")) return "react";
              if (id.includes("zod")) return "zod";
            }
          },
        },
      },
    },
  },
});
