import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";

export function PWARegister() {
  useEffect(() => {
    registerSW({
      onNeedRefresh() {
        // Opcional: notificar o usuário sobre uma atualização disponível
      },
      onOfflineReady() {
        // Opcional: notificar que o app está pronto para uso offline
      },
    });
  }, []);

  return null;
}
