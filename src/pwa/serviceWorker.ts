const SW_URL = "./sw.js";

let registrationRef: ServiceWorkerRegistration | null = null;
let registerPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export function isServiceWorkerSupported(): boolean {
  return "serviceWorker" in navigator && window.location.protocol !== "file:";
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  if (registerPromise) {
    return registerPromise;
  }

  registerPromise = (async () => {
    try {
      registrationRef = await navigator.serviceWorker.register(SW_URL);
      return registrationRef;
    } catch {
      return null;
    }
  })();

  return registerPromise;
}

export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return registrationRef;
}
