import { computed, onMounted, onUnmounted, ref } from "vue";
import { registerShareSupport } from "@/composables/usePumlShare";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isFileProtocol(): boolean {
  return window.location.protocol === "file:";
}

function isStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function usePwaInstall() {
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
  const isInstalled = ref(isStandaloneMode());
  const isInstalling = ref(false);

  const canShowInstallButton = computed(
    () =>
      !isFileProtocol() &&
      !isInstalled.value &&
      deferredPrompt.value !== null,
  );

  async function installApp(): Promise<void> {
    if (!deferredPrompt.value) {
      return;
    }

    isInstalling.value = true;

    try {
      await deferredPrompt.value.prompt();
      const choice = await deferredPrompt.value.userChoice;

      if (choice.outcome === "accepted") {
        isInstalled.value = true;
      }
    } finally {
      deferredPrompt.value = null;
      isInstalling.value = false;
    }
  }

  const onBeforeInstallPrompt = (event: Event): void => {
    event.preventDefault();
    deferredPrompt.value = event as BeforeInstallPromptEvent;
  };

  const onAppInstalled = (): void => {
    isInstalled.value = true;
    deferredPrompt.value = null;
  };

  const standaloneMedia = window.matchMedia("(display-mode: standalone)");

  const onDisplayModeChange = (): void => {
    isInstalled.value = isStandaloneMode();
  };

  onMounted(() => {
    if (isFileProtocol()) {
      return;
    }

    void registerShareSupport();

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    standaloneMedia.addEventListener("change", onDisplayModeChange);
  });

  onUnmounted(() => {
    window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.removeEventListener("appinstalled", onAppInstalled);
    standaloneMedia.removeEventListener("change", onDisplayModeChange);
  });

  return {
    canShowInstallButton,
    isInstalling,
    installApp,
  };
}
