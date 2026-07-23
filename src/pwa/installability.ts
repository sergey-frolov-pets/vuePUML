export type PwaInstallPlatform = "ios" | "android" | "desktop" | "unknown";

export type ServiceWorkerState = "unsupported" | "none" | "registered" | "controlling";

export interface PwaInstallStatus {
  secureContext: boolean;
  protocol: string;
  serviceWorker: ServiceWorkerState;
  manifestLinked: boolean;
  hasDeferredPrompt: boolean;
  isStandalone: boolean;
  relatedAppInstalled: boolean;
  platform: PwaInstallPlatform;
  supportsBeforeInstallPrompt: boolean;
}

export function detectPwaInstallPlatform(): PwaInstallPlatform {
  const userAgent = navigator.userAgent;

  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return "ios";
  }

  if (/Android/i.test(userAgent)) {
    return "android";
  }

  if (/Windows|Macintosh|Linux|CrOS/.test(userAgent)) {
    return "desktop";
  }

  return "unknown";
}

export function supportsBeforeInstallPromptEvent(): boolean {
  return (
    /Chrome|Chromium|Edg|OPR|SamsungBrowser/i.test(navigator.userAgent) &&
    !/Firefox|FxiOS/i.test(navigator.userAgent)
  );
}

export async function getServiceWorkerState(): Promise<ServiceWorkerState> {
  if (!("serviceWorker" in navigator)) {
    return "unsupported";
  }

  try {
    const scope = new URL("./", window.location.href).href;
    const registration =
      (await navigator.serviceWorker.getRegistration(scope)) ??
      (await navigator.serviceWorker.getRegistration("/")) ??
      (await navigator.serviceWorker.getRegistration());

    if (!registration) {
      return "none";
    }

    if (navigator.serviceWorker.controller) {
      return "controlling";
    }

    return "registered";
  } catch {
    return "none";
  }
}

export async function inspectPwaInstallStatus(options: {
  hasDeferredPrompt: boolean;
  relatedAppInstalled: boolean;
  isStandalone: boolean;
}): Promise<PwaInstallStatus> {
  return {
    secureContext: window.isSecureContext,
    protocol: window.location.protocol,
    serviceWorker: await getServiceWorkerState(),
    manifestLinked: Boolean(
      document.querySelector('link[rel="manifest"]'),
    ),
    hasDeferredPrompt: options.hasDeferredPrompt,
    isStandalone: options.isStandalone,
    relatedAppInstalled: options.relatedAppInstalled,
    platform: detectPwaInstallPlatform(),
    supportsBeforeInstallPrompt: supportsBeforeInstallPromptEvent(),
  };
}

export function buildManualInstallMessage(status: PwaInstallStatus): string {
  if (!status.secureContext) {
    return (
      "Сайт открыт по HTTP. Установка PWA работает только по HTTPS.\n\n" +
      "В GitHub: Settings → Pages → Custom domain → включите «Enforce HTTPS»."
    );
  }

  if (status.isStandalone || status.relatedAppInstalled) {
    return (
      "Приложение уже установлено. Откройте его с рабочего стола или из меню приложений."
    );
  }

  if (status.platform === "ios") {
    return (
      "Safari на iPhone/iPad не поддерживает автоматическую установку через кнопку.\n\n" +
      "Нажмите «Поделиться» → «На экран Домой» → «Добавить»."
    );
  }

  if (!status.supportsBeforeInstallPrompt) {
    return (
      "Этот браузер не поддерживает автоматическую установку PWA.\n\n" +
      "Откройте сайт в Chrome или Edge и используйте меню браузера → «Установить приложение»."
    );
  }

  if (status.serviceWorker === "none") {
    const swError = window.__pwaSwRegistrationError;
    const errorHint = swError
      ? `\n\nОшибка регистрации: ${swError}`
      : "";

    return (
      "Service Worker не зарегистрирован — браузер не считает сайт устанавливаемым.\n\n" +
      "Перезагрузите страницу. Если не поможет — откройте страницу установки." +
      errorHint
    );
  }

  if (status.serviceWorker === "registered") {
    return (
      "Service Worker ещё не активен на этой вкладке.\n\n" +
      "Перезагрузите страницу один раз, затем снова нажмите «Установить»."
    );
  }

  return (
    "Chrome не выдал автоматическую установку. Чаще всего это бывает, если вы ранее нажали «Отмена» в диалоге браузера.\n\n" +
    "Установите вручную: меню браузера (⋮) → «Установить приложение» / «Добавить на главный экран»."
  );
}
