import { computed, ref } from "vue";
import { useAppDialog } from "@/composables/useAppDialog";
import {
  deferredInstallPrompt,
  isFileProtocol,
  isPwaInstallSupported,
  isPwaInstalled,
  markPwaInstalled,
} from "@/pwa/installPromptState";

const HTTPS_SETUP_MESSAGE =
  "Сайт открыт по HTTP. Установка PWA возможна только по HTTPS. " +
  "В GitHub: Settings → Pages → Custom domain → дождитесь проверки DNS и включите «Enforce HTTPS».";

const BROWSER_INSTALL_MESSAGE =
  "Браузер не предлагает установку повторно. Откройте меню браузера → «Установить приложение» или «Добавить на главный экран».";

const ALREADY_INSTALLED_MESSAGE =
  "Приложение уже установлено. Откройте его с рабочего стола, из меню приложений или через иконку на панели задач. " +
  "Для обновления используйте кнопку «Обновить» в установленном приложении.";

export function usePwaInstall() {
  const isInstalling = ref(false);
  const { alert } = useAppDialog();

  const canShowInstallButton = computed(
    () => !isFileProtocol() && !isPwaInstalled.value,
  );

  const canInstallNow = computed(
    () => isPwaInstallSupported() && deferredInstallPrompt.value !== null,
  );

  const needsHttps = computed(
    () => !isFileProtocol() && !isPwaInstallSupported(),
  );

  async function installApp(): Promise<void> {
    if (!isPwaInstallSupported()) {
      await alert({
        title: "Нужен HTTPS",
        message: HTTPS_SETUP_MESSAGE,
        variant: "error",
      });
      return;
    }

    const promptEvent = deferredInstallPrompt.value;
    if (!promptEvent) {
      await alert({
        title: isPwaInstalled.value ? "Уже установлено" : "Установка недоступна",
        message: isPwaInstalled.value
          ? ALREADY_INSTALLED_MESSAGE
          : BROWSER_INSTALL_MESSAGE,
      });
      return;
    }

    isInstalling.value = true;

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;

      if (choice.outcome === "accepted") {
        markPwaInstalled();
      }
    } finally {
      deferredInstallPrompt.value = null;
      isInstalling.value = false;
    }
  }

  return {
    canShowInstallButton,
    canInstallNow,
    needsHttps,
    isInstalling,
    installApp,
  };
}
