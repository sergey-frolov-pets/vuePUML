import { computed, ref, watch } from "vue";
import {
  DEFAULT_LOCALE,
  isAppLocale,
  STORAGE_KEY_LOCALE,
  type AppLocale,
} from "@/constants/i18n";
import { formatMessage, messagesByLocale } from "@/locales/messages";

const locale = ref<AppLocale>(readInitialLocale());

function readInitialLocale(): AppLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LOCALE);
    if (saved && isAppLocale(saved)) {
      return saved;
    }
  } catch {
    // file:// может блокировать localStorage
  }

  const browserLang = navigator.language.slice(0, 2).toLowerCase();
  if (isAppLocale(browserLang)) {
    return browserLang;
  }

  return DEFAULT_LOCALE;
}

function persistLocale(value: AppLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOCALE, value);
  } catch {
    // file:// может блокировать localStorage
  }
}

function applyDocumentLocale(value: AppLocale): void {
  document.documentElement.lang = value;
}

watch(
  locale,
  (value) => {
    persistLocale(value);
    applyDocumentLocale(value);
  },
  { immediate: true },
);

export function useLocale() {
  const messages = computed(() => messagesByLocale[locale.value]);

  function t(key: string, params?: Record<string, string | number>): string {
    const template = messages.value[key] ?? messagesByLocale[DEFAULT_LOCALE][key] ?? key;
    return formatMessage(template, params);
  }

  function setLocale(value: AppLocale): void {
    locale.value = value;
  }

  return {
    locale,
    setLocale,
    t,
  };
}
