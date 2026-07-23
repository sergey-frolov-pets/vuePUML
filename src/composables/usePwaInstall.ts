import { computed, ref } from "vue";
import { useAppDialog } from "@/composables/useAppDialog";
import {
  deferredInstallPrompt,
  isFileProtocol,
  isPwaInstallSupported,
  isRelatedAppCheckDone,
  isRelatedAppInstalled,
  isStandaloneApp,
  installCompletedThisSession,
  refreshRelatedAppInstalledState,
} from "@/pwa/installPromptState";

const HTTPS_SETUP_MESSAGE =
  "Сайт открыт по HTTP. Установка PWA возможна только по HTTPS. " +
  "В GitHub: Settings → Pages → Custom domain → дождитесь проверки DNS и включите «Enforce HTTPS».";

const BROWSER_INSTALL_MESSAGE =
  "Браузер ещё не готов предложить установку. Подождите несколько секунд и нажмите снова " +
  "или откройте меню браузера → «Установить приложение» / «Добавить на главный экран».";

const ALREADY_INSTALLED_MESSAGE =
  "Приложение уже установлено. Откройте его с рабочего стола, из меню приложений или через иконку на панели задач. " +
  "Если вы удалили приложение — перезагрузите страницу и подождите, пока браузер снова предложит установку.";

export function usePwaInstall() {
  const isInstalling = ref(false);
  const { alert } = useAppDialog();

  const canShowInstallButton = computed(() => {
    if (isFileProtocol() || isStandaloneApp()) {
      return false;
    }

    if (deferredInstallPrompt.value) {
      return true;
    }

    if (installCompletedThisSession.value) {
      return false;
    }

    if (!isRelatedAppCheckDone.value) {
      return true;
    }

    return !isRelatedAppInstalled.value;
  });

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
      const installed = await refreshRelatedAppInstalledState();
      await alert({
        title: installed ? "Уже установлено" : "Установка недоступна",
        message: installed ? ALREADY_INSTALLED_MESSAGE : BROWSER_INSTALL_MESSAGE,
      });
      return;
    }

    isInstalling.value = true;

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;

      if (choice.outcome === "accepted") {
        isRelatedAppInstalled.value = true;
        installCompletedThisSession.value = true;
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
