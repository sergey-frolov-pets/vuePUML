import { computed, ref } from "vue";
import { STORAGE_KEY_LIBRARY_API_URL } from "@/constants/diagram-library";

function readStoredLibraryApiUrl(): string | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LIBRARY_API_URL);
    if (saved !== null) {
      return saved;
    }
  } catch {
    // file:// может блокировать localStorage
  }

  return null;
}

export function normalizeLibraryApiUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  let url = trimmed.replace(/\/+$/, "");
  if (!url.endsWith("/api")) {
    url = `${url}/api`;
  }

  return url;
}

function readInitialLibraryApiUrl(): string {
  const saved = readStoredLibraryApiUrl();
  if (saved !== null) {
    return normalizeLibraryApiUrl(saved);
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return normalizeLibraryApiUrl(envUrl);
  }

  return "";
}

const libraryApiUrl = ref(readInitialLibraryApiUrl());

export function getLibraryApiBaseUrl(): string {
  return libraryApiUrl.value;
}

export function isLibraryServerConfigured(): boolean {
  return Boolean(libraryApiUrl.value);
}

export function useLibraryApiUrl() {
  const isLocalMode = computed(() => !libraryApiUrl.value);

  function setLibraryApiUrl(value: string): void {
    const normalized = normalizeLibraryApiUrl(value);
    libraryApiUrl.value = normalized;

    try {
      localStorage.setItem(STORAGE_KEY_LIBRARY_API_URL, normalized);
    } catch {
      // file:// может блокировать localStorage
    }
  }

  function readRawLibraryApiUrl(): string {
    const saved = readStoredLibraryApiUrl();
    if (saved !== null) {
      return saved;
    }

    return libraryApiUrl.value;
  }

  return {
    libraryApiUrl,
    isLocalMode,
    setLibraryApiUrl,
    readRawLibraryApiUrl,
  };
}
