import { computed, ref } from "vue";
import {
  deferredInstallPrompt,
  isFileProtocol,
  isPwaInstalled,
} from "@/pwa/installPromptState";

export function usePwaInstall() {
  const isInstalling = ref(false);

  const canShowInstallButton = computed(
    () => !isFileProtocol() && !isPwaInstalled.value,
  );

  const canInstallNow = computed(() => deferredInstallPrompt.value !== null);

  async function installApp(): Promise<void> {
    const promptEvent = deferredInstallPrompt.value;
    if (!promptEvent) {
      return;
    }

    isInstalling.value = true;

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;

      if (choice.outcome === "accepted") {
        isPwaInstalled.value = true;
      }
    } finally {
      deferredInstallPrompt.value = null;
      isInstalling.value = false;
    }
  }

  return {
    canShowInstallButton,
    canInstallNow,
    isInstalling,
    installApp,
  };
}
