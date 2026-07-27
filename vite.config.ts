import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(), 
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false
      },
      selfDestroying: mode === 'development',
      manifest: {
        name: 'FireFit',
        short_name: 'FireFit',
        description: 'Seu RPG de academia! Transforme seus treinos em XP.',
        theme_color: '#0D0E15',
        background_color: '#0D0E15',
        display: 'standalone',
        icons: [
          {
            src: 'avatar-strong.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
