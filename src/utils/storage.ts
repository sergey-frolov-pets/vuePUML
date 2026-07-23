export function readStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // file:// и приватный режим могут блокировать localStorage
  }
}

export function readStorageBoolean(key: string): boolean | null {
  const saved = readStorageItem(key);
  if (saved === null) {
    return null;
  }

  return saved === "true";
}
