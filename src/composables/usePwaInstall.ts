import { computed } from "vue";
import { useAppDialog } from "@/composables/useAppDialog";
import {
  getCurrentAppVersion,
  readInstalledAppVersion,
  writeInstalledAppVersion,
} from "@/pwa/appVersion";
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
import { applyPwaUpdate, checkForPwaUpdate } from "@/pwa/pwaUpdateService";

const HTTPS_SETUP_MESSAGE =
  "Сайт открыт по HTTP. Установка PWA возможна только по HTTPS. " +
  "В GitHub: Settings → Pages → Custom domain → дождитесь проверки DNS и включите «Enforce HTTPS».";

const BROWSER_INSTALL_MESSAGE =
  "Браузер ещё не готов предложить установку. Подождите несколько секунд и нажмите снова " +
  "или откройте меню браузера → «Установить приложение» / «Добавить на главный экран».";

const INSTALL_ERROR_MESSAGE =
  "Не удалось выполнить установку. Попробуйте через меню браузера или перезагрузите страницу.";

function formatInstalledVersionMessage(installedVersion: string | null): string {
  const currentVersion = getCurrentAppVersion();
  const installedLabel = installedVersion ?? "неизвестная";

  return (
    `Установлена версия ${installedLabel}, актуальная — ${currentVersion}. ` +
    "Для полной переустановки удалите приложение с устройства, затем установите снова."
  );
}

export function usePwaInstall() {
  const { alert, confirm } = useAppDialog();

  const isAlreadyInstalled = computed(
    () =>
      isRelatedAppInstalled.value ||
      installCompletedThisSession.value,
  );

  const canShowInstallButton = computed(
    () => !isFileProtocol() && !isStandaloneApp(),
  );

  const canInstallNow = computed(() => {
    if (!isPwaInstallSupported()) {
      return false;
    }

    return Boolean(deferredInstallPrompt.value) || isAlreadyInstalled.value;
  });

  const needsHttps = computed(
    () => !isFileProtocol() && !isPwaInstallSupported(),
  );

  async function isAppAlreadyInstalled(): Promise<boolean> {
    if (installCompletedThisSession.value) {
      return true;
    }

    if (isRelatedAppInstalled.value) {
      return true;
    }

    return refreshRelatedAppInstalledState();
  }

  async function handleInstalledAppAction(): Promise<void> {
    const updateCheck = await checkForPwaUpdate();
    const installedVersion =
      updateCheck.installedVersion ?? updateCheck.activeSwVersion;

    if (updateCheck.hasUpdate) {
      const confirmed = await confirm({
        title: "Доступна новая версия",
        message: `Установлена версия ${installedVersion ?? "старая"}, доступна ${updateCheck.currentVersion}. Обновить приложение?`,
        confirmLabel: "Обновить",
      });

      if (!confirmed) {
        return;
      }

      await applyPwaUpdate();
      return;
    }

    await alert({
      title: "Приложение уже установлено",
      message: formatInstalledVersionMessage(installedVersion),
    });
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

      const promptEvent = deferredInstallPrompt.value;
      if (promptEvent) {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;

        if (choice.outcome === "accepted") {
          isRelatedAppInstalled.value = true;
          installCompletedThisSession.value = true;
          writeInstalledAppVersion(getCurrentAppVersion());
        }

        deferredInstallPrompt.value = null;
        return;
      }

      if (await isAppAlreadyInstalled()) {
        await handleInstalledAppAction();
        return;
      }

      if (readInstalledAppVersion() !== null) {
        await handleInstalledAppAction();
        return;
      }

      await alert({
        title: "Установка недоступна",
        message: BROWSER_INSTALL_MESSAGE,
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
