import { computed } from "vue";
import { APP_LINKS } from "@/constants";
import { useAppDialog } from "@/composables/useAppDialog";
import {
  buildManualInstallMessage,
  inspectPwaInstallStatus,
} from "@/pwa/installability";
import {
  registerAppServiceWorker,
  waitForServiceWorkerControl,
} from "@/pwa/serviceWorkerRegistration";
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

const INSTALL_ERROR_MESSAGE =
  "Не удалось выполнить установку. Попробуйте через меню браузера или перезагрузите страницу.";

export function usePwaInstall() {
  const { alert, confirm } = useAppDialog();

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

  async function showManualInstallHelp(): Promise<void> {
    syncEarlyPrompt();
    await registerAppServiceWorker();
    await waitForServiceWorkerControl();
    const installed = await refreshRelatedAppInstalledState();
    const status = await inspectPwaInstallStatus({
      hasDeferredPrompt: deferredInstallPrompt.value !== null,
      relatedAppInstalled: installed || isAlreadyInstalled.value,
      isStandalone: isStandaloneApp(),
    });

    const message = buildManualInstallMessage(status);
    const openInstallPage = await confirm({
      title: "Установка вручную",
      message: `${message}\n\nОткрыть страницу с инструкциями?`,
      confirmLabel: "Открыть",
      cancelLabel: "Закрыть",
    });

    if (openInstallPage) {
      window.location.assign(APP_LINKS.installPage);
    }
  }

  function syncEarlyPrompt(): void {
    const earlyPrompt = window.__deferredPwaInstallPrompt;
    if (earlyPrompt && !deferredInstallPrompt.value) {
      deferredInstallPrompt.value = earlyPrompt;
    }
  }

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

      syncEarlyPrompt();
      await registerAppServiceWorker();
      await waitForServiceWorkerControl();

      const promptEvent = deferredInstallPrompt.value;
      if (promptEvent) {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;

        if (choice.outcome === "accepted") {
          isRelatedAppInstalled.value = true;
          installCompletedThisSession.value = true;
        }

        deferredInstallPrompt.value = null;
        window.__deferredPwaInstallPrompt = null;
        return;
      }

      const installed = await refreshRelatedAppInstalledState();
      if (installed || isAlreadyInstalled.value) {
        await alert({
          title: "Уже установлено",
          message:
            "Приложение уже установлено. Откройте его с рабочего стола или из меню приложений.",
        });
        return;
      }

      await showManualInstallHelp();
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
