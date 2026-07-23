import { ref } from "vue";
import {
  getCurrentAppVersion,
  isVersionOutdated,
  readInstalledAppVersion,
  writeInstalledAppVersion,
} from "@/pwa/appVersion";
import {
  getServiceWorkerRegistration,
  isServiceWorkerSupported,
  registerServiceWorker,
} from "@/pwa/serviceWorker";

const UPDATE_CHECK_DELAY_MS = 300;
const SW_VERSION_TIMEOUT_MS = 800;
const SW_UPDATE_TIMEOUT_MS = 3000;

export const updateAvailable = ref(false);

let reloadOnControllerChange = false;
let registration: ServiceWorkerRegistration | null = null;

export type PwaUpdateCheckResult = {
  hasUpdate: boolean;
  currentVersion: string;
  installedVersion: string | null;
  activeSwVersion: string | null;
  waitingWorker: boolean;
};

function markUpdateAvailable(worker: ServiceWorker | null): void {
  if (worker && navigator.serviceWorker.controller) {
    updateAvailable.value = true;
  }
}

export function bindPwaRegistration(reg: ServiceWorkerRegistration): void {
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

async function waitForUpdateCheck(): Promise<void> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, UPDATE_CHECK_DELAY_MS);
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => resolve(null), timeoutMs);

    void promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch(() => {
        window.clearTimeout(timeoutId);
        resolve(null);
      });
  });
}

async function readActiveSwVersion(
  reg: ServiceWorkerRegistration,
): Promise<string | null> {
  const activeWorker = reg.active;
  if (!activeWorker) {
    return null;
  }

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timeoutId = window.setTimeout(() => resolve(null), SW_VERSION_TIMEOUT_MS);

    channel.port1.onmessage = (event: MessageEvent<{ version?: string }>) => {
      window.clearTimeout(timeoutId);
      resolve(event.data?.version ?? null);
    };

    activeWorker.postMessage({ type: "GET_VERSION" }, [channel.port2]);
  });
}

export async function checkForPwaUpdate(): Promise<PwaUpdateCheckResult> {
  const currentVersion = getCurrentAppVersion();
  const installedVersion = readInstalledAppVersion();
  let waitingWorker = false;
  let activeSwVersion: string | null = null;

  const reg = registration ?? getServiceWorkerRegistration();
  if (reg) {
    await withTimeout(
      (async () => {
        await reg.update();
        await waitForUpdateCheck();
        waitingWorker = Boolean(reg.waiting);
        activeSwVersion = await readActiveSwVersion(reg);
        return true;
      })(),
      SW_UPDATE_TIMEOUT_MS,
    );
  }

  const hasUpdate =
    waitingWorker ||
    isVersionOutdated(installedVersion) ||
    (activeSwVersion !== null && activeSwVersion !== currentVersion);

  if (hasUpdate) {
    updateAvailable.value = true;
  }

  return {
    hasUpdate,
    currentVersion,
    installedVersion,
    activeSwVersion,
    waitingWorker,
  };
}

export async function applyPwaUpdate(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    writeInstalledAppVersion(getCurrentAppVersion());
    window.location.reload();
    return true;
  }

  const reg = registration ?? getServiceWorkerRegistration();
  if (!reg) {
    writeInstalledAppVersion(getCurrentAppVersion());
    window.location.reload();
    return true;
  }

  try {
    await reg.update();
    await waitForUpdateCheck();
  } catch {
    // continue with reload attempt
  }

  const waitingWorker = reg.waiting;
  if (waitingWorker) {
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
  }

  writeInstalledAppVersion(getCurrentAppVersion());
  updateAvailable.value = false;
  window.location.reload();
  return true;
}

export async function checkForUpdateSilently(): Promise<void> {
  if (!registration) {
    return;
  }

  try {
    await registration.update();
    markUpdateAvailable(registration.waiting);
  } catch {
    // optional PWA feature
  }
}

export function initPwaUpdate(): void {
  if (!isServiceWorkerSupported()) {
    return;
  }

  navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void checkForUpdateSilently();
    }
  });

  void registerServiceWorker().then((reg) => {
    if (reg) {
      bindPwaRegistration(reg);
    }
  });
}
