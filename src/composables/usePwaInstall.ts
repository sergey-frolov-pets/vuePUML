import { computed, ref } from "vue";
import { useAppDialog } from "@/composables/useAppDialog";
import {
  getCurrentAppVersion,
  installedAppVersion,
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
import { applyPwaUpdate, checkForPwaUpdate } from "@/pwa/pwaUpdateService";

const HTTPS_SETUP_MESSAGE =
  "Сайт открыт по HTTP. Установка PWA возможна только по HTTPS. " +
  "В GitHub: Settings → Pages → Custom domain → дождитесь проверки DNS и включите «Enforce HTTPS».";

const BROWSER_INSTALL_MESSAGE =
  "Браузер ещё не готов предложить установку. Подождите несколько секунд и нажмите снова " +
  "или откройте меню браузера → «Установить приложение» / «Добавить на главный экран».";

function formatInstalledVersionMessage(installedVersion: string | null): string {
  const currentVersion = getCurrentAppVersion();
  const installedLabel = installedVersion ?? "неизвестная";

  return (
    `Установлена версия ${installedLabel}, актуальная — ${currentVersion}. ` +
    "Для полной переустановки удалите приложение с устройства, затем установите снова."
  );
}

export function usePwaInstall() {
  const isInstalling = ref(false);
  const { alert, confirm } = useAppDialog();

  const isAlreadyInstalled = computed(
    () =>
      isRelatedAppInstalled.value ||
      installCompletedThisSession.value ||
      installedAppVersion.value !== null,
  );

  const canShowInstallButton = computed(
    () => !isFileProtocol() && !isStandaloneApp(),
  );

  const canInstallNow = computed(() => {
    if (!isPwaInstallSupported()) {
      return false;
    }

    if (deferredInstallPrompt.value) {
      return true;
    }

    return isAlreadyInstalled.value;
  });

  const needsHttps = computed(
    () => !isFileProtocol() && !isPwaInstallSupported(),
  );

  async function isAppAlreadyInstalled(): Promise<boolean> {
    if (installCompletedThisSession.value) {
      return true;
    }

    if (readInstalledAppVersion() !== null) {
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

      isInstalling.value = true;

      try {
        await applyPwaUpdate();
      } finally {
        isInstalling.value = false;
      }

      return;
    }

    await alert({
      title: "Приложение уже установлено",
      message: formatInstalledVersionMessage(installedVersion),
    });
  }

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
    if (promptEvent) {
      isInstalling.value = true;

      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;

        if (choice.outcome === "accepted") {
          isRelatedAppInstalled.value = true;
          installCompletedThisSession.value = true;
          writeInstalledAppVersion(getCurrentAppVersion());
        }
      } finally {
        deferredInstallPrompt.value = null;
        isInstalling.value = false;
      }

      return;
    }

    if (await isAppAlreadyInstalled()) {
      await handleInstalledAppAction();
      return;
    }

    await alert({
      title: "Установка недоступна",
      message: BROWSER_INSTALL_MESSAGE,
    });
  }

  return {
    canShowInstallButton,
    canInstallNow,
    needsHttps,
    isAlreadyInstalled,
    isInstalling,
    installApp,
  };
}
