import { computed, ref } from "vue";
import { useAppDialog } from "@/composables/useAppDialog";
import {
  getServiceWorkerRegistration,
  isServiceWorkerSupported,
  registerServiceWorker,
} from "@/pwa/serviceWorker";
import { isStandaloneApp } from "@/pwa/installPromptState";

const UPDATE_CHECK_DELAY_MS = 600;

const updateAvailable = ref(false);
const isUpdating = ref(false);

let reloadOnControllerChange = false;
let registration: ServiceWorkerRegistration | null = null;

function markUpdateAvailable(worker: ServiceWorker | null): void {
  if (worker && navigator.serviceWorker.controller) {
    updateAvailable.value = true;
  }
}

function bindRegistration(reg: ServiceWorkerRegistration): void {
  registration = reg;
  markUpdateAvailable(reg.waiting);

  reg.addEventListener("updatefound", () => {
    const installingWorker = reg.installing;
    if (!installingWorker) {
      return;
    }

    installingWorker.addEventListener("statechange", () => {
      if (installingWorker.state === "installed") {
        markUpdateAvailable(installingWorker);
      }
    });
  });
}

function onControllerChange(): void {
  if (!reloadOnControllerChange) {
    return;
  }

  reloadOnControllerChange = false;
  window.location.reload();
}

function onVisibilityChange(): void {
  if (document.visibilityState === "visible") {
    void checkForUpdateSilently();
  }
}

async function checkForUpdateSilently(): Promise<void> {
  if (!registration) {
    return;
  }

  try {
    await registration.update();
  } catch {
    // optional PWA feature
  }
}

async function waitForUpdateCheck(): Promise<void> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, UPDATE_CHECK_DELAY_MS);
  });
}

export function initPwaUpdate(): void {
  if (!isServiceWorkerSupported()) {
    return;
  }

  navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
  document.addEventListener("visibilitychange", onVisibilityChange);

  void registerServiceWorker().then((reg) => {
    if (reg) {
      bindRegistration(reg);
    }
  });
}

export function usePwaUpdate() {
  const { confirm, alert } = useAppDialog();

  const canShowUpdateButton = computed(() => isStandaloneApp());

  async function applyWaitingWorker(): Promise<boolean> {
    const reg = registration ?? getServiceWorkerRegistration();
    const waitingWorker = reg?.waiting;

    if (!waitingWorker) {
      return false;
    }

    reloadOnControllerChange = true;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });

    await new Promise<void>((resolve) => {
      const timeoutId = window.setTimeout(() => {
        reloadOnControllerChange = false;
        resolve();
      }, 4000);

      const onReady = (): void => {
        window.clearTimeout(timeoutId);
        resolve();
      };

      navigator.serviceWorker.addEventListener("controllerchange", onReady, {
        once: true,
      });
    });

    return true;
  }

  async function refreshApp(): Promise<void> {
    if (!isServiceWorkerSupported() || isUpdating.value) {
      window.location.reload();
      return;
    }

    isUpdating.value = true;

    try {
      const reg = registration ?? getServiceWorkerRegistration();
      if (reg) {
        await reg.update();
        await waitForUpdateCheck();

        if (reg.waiting || updateAvailable.value) {
          const applied = await applyWaitingWorker();
          if (applied) {
            window.location.reload();
            return;
          }
        }
      }

      window.location.reload();
    } finally {
      isUpdating.value = false;
    }
  }

  async function updateApp(): Promise<void> {
    if (isUpdating.value) {
      return;
    }

    if (updateAvailable.value) {
      const confirmed = await confirm({
        title: "Обновить приложение?",
        message: "Доступна новая версия. Перезагрузить сейчас?",
        confirmLabel: "Обновить",
      });

      if (!confirmed) {
        return;
      }

      await refreshApp();
      return;
    }

    isUpdating.value = true;

    try {
      const reg = registration ?? getServiceWorkerRegistration();
      if (reg) {
        await reg.update();
        await waitForUpdateCheck();
      }

      if (updateAvailable.value || reg?.waiting) {
        const confirmed = await confirm({
          title: "Обновить приложение?",
          message: "Найдена новая версия. Перезагрузить сейчас?",
          confirmLabel: "Обновить",
        });

        if (confirmed) {
          await refreshApp();
        }

        return;
      }

      const reloadAnyway = await confirm({
        title: "Обновления нет",
        message:
          "Уже установлена последняя версия. Перезагрузить страницу на всякий случай?",
        confirmLabel: "Перезагрузить",
        cancelLabel: "Закрыть",
      });

      if (reloadAnyway) {
        window.location.reload();
      }
    } catch {
      await alert({
        title: "Не удалось проверить обновления",
        message: "Попробуйте перезагрузить страницу вручную.",
        variant: "error",
      });
    } finally {
      isUpdating.value = false;
    }
  }

  return {
    canShowUpdateButton,
    updateAvailable,
    isUpdating,
    updateApp,
  };
}
