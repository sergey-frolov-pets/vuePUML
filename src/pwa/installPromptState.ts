import { ref } from "vue";

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const deferredInstallPrompt = ref<InstallPromptEvent | null>(null);

function isStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export const isPwaInstalled = ref(isStandaloneMode());

export function isFileProtocol(): boolean {
  return window.location.protocol === "file:";
}

export function isPwaInstallSupported(): boolean {
  return window.isSecureContext && !isFileProtocol();
}

export function initInstallPromptCapture(): void {
  if (!isPwaInstallSupported()) {
    return;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt.value = event as InstallPromptEvent;
  });

  window.addEventListener("appinstalled", () => {
    isPwaInstalled.value = true;
    deferredInstallPrompt.value = null;
  });

  const standaloneMedia = window.matchMedia("(display-mode: standalone)");
  standaloneMedia.addEventListener("change", () => {
    isPwaInstalled.value = isStandaloneMode();
  });
}
