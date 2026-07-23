import { ref } from "vue";
import { writeInstalledAppVersion, getCurrentAppVersion } from "@/pwa/appVersion";

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const deferredInstallPrompt = ref<InstallPromptEvent | null>(null);
export const isRelatedAppInstalled = ref(false);
export const isRelatedAppCheckDone = ref(false);
export const installCompletedThisSession = ref(false);

export function isStandaloneApp(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isFileProtocol(): boolean {
  return window.location.protocol === "file:";
}

export function isPwaInstallSupported(): boolean {
  return window.isSecureContext && !isFileProtocol();
}

export async function checkRelatedInstalledApps(): Promise<boolean> {
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

export async function refreshRelatedAppInstalledState(): Promise<boolean> {
  const installed = await checkRelatedInstalledApps();
  isRelatedAppInstalled.value = installed;
  isRelatedAppCheckDone.value = true;
  return installed;
}

export function initInstallPromptCapture(): void {
  if (!isPwaInstallSupported()) {
    isRelatedAppCheckDone.value = true;
    return;
  }

  void refreshRelatedAppInstalledState();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void refreshRelatedAppInstalledState();
    }
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    isRelatedAppInstalled.value = false;
    installCompletedThisSession.value = false;
    deferredInstallPrompt.value = event as InstallPromptEvent;
  });

  window.addEventListener("appinstalled", () => {
    isRelatedAppInstalled.value = true;
    installCompletedThisSession.value = true;
    deferredInstallPrompt.value = null;
    writeInstalledAppVersion(getCurrentAppVersion());
  });

  const standaloneMedia = window.matchMedia("(display-mode: standalone)");
  standaloneMedia.addEventListener("change", () => {
    if (isStandaloneApp()) {
      deferredInstallPrompt.value = null;
    }
  });
}
