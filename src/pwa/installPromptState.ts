import { ref } from "vue";
import { STORAGE_KEY_PWA_INSTALLED } from "@/constants";

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

function readPersistedInstallFlag(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_PWA_INSTALLED) === "true";
  } catch {
    return false;
  }
}

function persistInstallFlag(installed: boolean): void {
  try {
    if (installed) {
      localStorage.setItem(STORAGE_KEY_PWA_INSTALLED, "true");
      return;
    }

    localStorage.removeItem(STORAGE_KEY_PWA_INSTALLED);
  } catch {
    // file:// и приватный режим могут блокировать localStorage
  }
}

function computeInstalledState(): boolean {
  return isStandaloneMode() || readPersistedInstallFlag();
}

export const isPwaInstalled = ref(computeInstalledState());

export function isFileProtocol(): boolean {
  return window.location.protocol === "file:";
}

export function isPwaInstallSupported(): boolean {
  return window.isSecureContext && !isFileProtocol();
}

export function markPwaInstalled(): void {
  isPwaInstalled.value = true;
  persistInstallFlag(true);
}

export function clearPersistedInstallFlag(): void {
  isPwaInstalled.value = isStandaloneMode();
  persistInstallFlag(false);
}

async function detectRelatedInstalledApps(): Promise<boolean> {
  const getInstalledRelatedApps = (
    navigator as Navigator & {
      getInstalledRelatedApps?: () => Promise<unknown[]>;
    }
  ).getInstalledRelatedApps;

  if (!getInstalledRelatedApps) {
    return false;
  }

  try {
    const relatedApps = await getInstalledRelatedApps.call(navigator);
    return relatedApps.length > 0;
  } catch {
    return false;
  }
}

export function initInstallPromptCapture(): void {
  if (!isPwaInstallSupported()) {
    return;
  }

  void detectRelatedInstalledApps().then((installed) => {
    if (installed) {
      markPwaInstalled();
    }
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();

    if (isPwaInstalled.value && !isStandaloneMode()) {
      clearPersistedInstallFlag();
    }

    deferredInstallPrompt.value = event as InstallPromptEvent;
  });

  window.addEventListener("appinstalled", () => {
    markPwaInstalled();
    deferredInstallPrompt.value = null;
  });

  const standaloneMedia = window.matchMedia("(display-mode: standalone)");
  standaloneMedia.addEventListener("change", () => {
    if (isStandaloneMode()) {
      markPwaInstalled();
      return;
    }

    isPwaInstalled.value = readPersistedInstallFlag();
  });
}
