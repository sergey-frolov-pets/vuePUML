import { ref } from "vue";
import { APP_META } from "@/constants";

const STORAGE_KEY_PWA_VERSION = "plantuml-pwa-installed-version";

function readStoredVersion(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_PWA_VERSION);
  } catch {
    return null;
  }
}

export const installedAppVersion = ref<string | null>(readStoredVersion());

export function getCurrentAppVersion(): string {
  return APP_META.version;
}

export function readInstalledAppVersion(): string | null {
  return installedAppVersion.value;
}

export function writeInstalledAppVersion(version: string): void {
  installedAppVersion.value = version;

  try {
    localStorage.setItem(STORAGE_KEY_PWA_VERSION, version);
  } catch {
    // file:// и приватный режим могут блокировать localStorage
  }
}

export function clearInstalledAppVersion(): void {
  installedAppVersion.value = null;

  try {
    localStorage.removeItem(STORAGE_KEY_PWA_VERSION);
  } catch {
    // ignore
  }
}

export function isVersionOutdated(installedVersion: string | null): boolean {
  if (!installedVersion) {
    return false;
  }

  return installedVersion !== getCurrentAppVersion();
}
