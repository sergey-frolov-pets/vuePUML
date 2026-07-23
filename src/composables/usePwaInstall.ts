import { computed, onMounted, onUnmounted, ref } from "vue";
import { INSTALL_PAGE_PATH } from "@/constants";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isWebDeployment(): boolean {
  const { protocol, hostname } = window.location;
  return protocol === "https:" || (protocol === "http:" && hostname === "localhost");
}

export function usePwaInstall() {
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
  const isInstalled = ref(isStandaloneMode());
  const isInstalling = ref(false);

  const canShowInstallButton = computed(
    () => isWebDeployment() && !isInstalled.value,
  );

  const hasNativePrompt = computed(() => deferredPrompt.value !== null);

  async function installApp(): Promise<void> {
    if (deferredPrompt.value) {
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

      return;
    }

    window.location.assign(INSTALL_PAGE_PATH);
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
    hasNativePrompt,
    isInstalling,
    installApp,
  };
}
