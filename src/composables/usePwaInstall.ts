import { computed, ref } from "vue";
import { useAppDialog } from "@/composables/useAppDialog";
import {
  deferredInstallPrompt,
  isFileProtocol,
  isPwaInstalled,
} from "@/pwa/installPromptState";

export function usePwaInstall() {
  const isInstalling = ref(false);
  const { alert } = useAppDialog();

  const canShowInstallButton = computed(
    () => !isFileProtocol() && !isPwaInstalled.value,
  );

  const canInstallNow = computed(() => deferredInstallPrompt.value !== null);

  async function installApp(): Promise<void> {
    const promptEvent = deferredInstallPrompt.value;
    if (!promptEvent) {
      await alert({
        title: "Установка недоступна",
        message:
          "Браузер не предлагает установку повторно. Откройте меню браузера → «Установить приложение» или «Добавить на главный экран».",
      });
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
