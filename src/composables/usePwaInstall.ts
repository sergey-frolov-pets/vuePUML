import { computed } from "vue";
import { APP_LINKS } from "@/constants";
import { useAppDialog } from "@/composables/useAppDialog";
import {
  deferredInstallPrompt,
  isFileProtocol,
  isPwaInstallSupported,
  isRelatedAppInstalled,
  isStandaloneApp,
  installCompletedThisSession,
  refreshRelatedAppInstalledState,
} from "@/pwa/installPromptState";
import { isPwaInstallInProgress } from "@/pwa/pwaInstallState";

const HTTPS_SETUP_MESSAGE =
  "Сайт открыт по HTTP. Установка PWA возможна только по HTTPS. " +
  "В GitHub: Settings → Pages → Custom domain → дождитесь проверки DNS и включите «Enforce HTTPS».";

const BROWSER_INSTALL_MESSAGE =
  "Браузер ещё не готов предложить установку. Подождите несколько секунд и нажмите снова, " +
  "или откройте меню браузера → «Установить приложение» / «Добавить на главный экран».";

const ALREADY_INSTALLED_MESSAGE =
  "Приложение уже установлено. Откройте его с рабочего стола или из меню приложений. " +
  "Если вы удалили приложение — перезагрузите страницу и подождите предложения установки.";

const INSTALL_ERROR_MESSAGE =
  "Не удалось выполнить установку. Попробуйте через меню браузера или перезагрузите страницу.";

export function usePwaInstall() {
  const { alert } = useAppDialog();

  const isAlreadyInstalled = computed(
    () =>
      isRelatedAppInstalled.value || installCompletedThisSession.value,
  );

  const canShowInstallButton = computed(
    () => !isFileProtocol() && !isStandaloneApp(),
  );

  const canInstallNow = computed(
    () => isPwaInstallSupported() && deferredInstallPrompt.value !== null,
  );

  const needsHttps = computed(
    () => !isFileProtocol() && !isPwaInstallSupported(),
  );

  async function installApp(): Promise<void> {
    if (isPwaInstallInProgress.value) {
      return;
    }

    isPwaInstallInProgress.value = true;

    try {
      if (!isPwaInstallSupported()) {
        await alert({
          title: "Нужен HTTPS",
          message: HTTPS_SETUP_MESSAGE,
          variant: "error",
        });
        return;
      }

      const promptEvent = deferredInstallPrompt.value;
      if (promptEvent) {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;

        if (choice.outcome === "accepted") {
          isRelatedAppInstalled.value = true;
          installCompletedThisSession.value = true;
        }

        deferredInstallPrompt.value = null;
        return;
      }

      const installed = await refreshRelatedAppInstalledState();
      if (installed || isAlreadyInstalled.value) {
        await alert({
          title: "Уже установлено",
          message: ALREADY_INSTALLED_MESSAGE,
        });
        return;
      }

      await alert({
        title: "Установка недоступна",
        message: `${BROWSER_INSTALL_MESSAGE}\n\nПодробнее: ${APP_LINKS.installPage}`,
      });
    } catch {
      await alert({
        title: "Ошибка установки",
        message: INSTALL_ERROR_MESSAGE,
        variant: "error",
      });
    } finally {
      isPwaInstallInProgress.value = false;
    }
  }

  return {
    canShowInstallButton,
    canInstallNow,
    needsHttps,
    isAlreadyInstalled,
    isInstalling: isPwaInstallInProgress,
    installApp,
  };
}
