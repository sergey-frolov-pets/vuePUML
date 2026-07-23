import { computed, ref, watch, type Ref } from "vue";
import {
  LAYOUT_ENGINES,
  STORAGE_KEY_DARK,
  STORAGE_KEY_DIAGRAM_DARK,
  STORAGE_KEY_LAYOUT,
  STORAGE_KEY_SOURCE,
  STORAGE_KEY_UI_DARK,
  type LayoutEngine,
} from "@/constants";
import {
  DEFAULT_EDITOR_FONT_FAMILY_ID,
  DEFAULT_EDITOR_FONT_SIZE,
  DEFAULT_PREVIEW_BG,
  isEditorFontFamilyId,
  isEditorFontSize,
  resolveEditorFontFamily,
  STORAGE_KEY_EDITOR_FONT_FAMILY,
  STORAGE_KEY_EDITOR_FONT_SIZE,
  STORAGE_KEY_PREVIEW_BG,
  type EditorFontFamilyId,
  type EditorFontSize,
} from "@/constants/editor-settings";
import { normalizeColor } from "@/utils/color";
import {
  readStorageBoolean,
  readStorageItem,
  writeStorageItem,
} from "@/utils/storage";

type AppSettingsOptions = {
  source: Ref<string>;
  layout: Ref<LayoutEngine>;
};

function readInitialUiDarkMode(): boolean {
  return (
    readStorageBoolean(STORAGE_KEY_UI_DARK) ??
    readStorageBoolean(STORAGE_KEY_DARK) ??
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function readInitialDiagramDarkMode(): boolean {
  return (
    readStorageBoolean(STORAGE_KEY_DIAGRAM_DARK) ??
    readStorageBoolean(STORAGE_KEY_DARK) ??
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function readInitialEditorFontSize(): EditorFontSize {
  const saved = readStorageItem(STORAGE_KEY_EDITOR_FONT_SIZE);
  if (saved && isEditorFontSize(saved)) {
    return saved;
  }

  return DEFAULT_EDITOR_FONT_SIZE;
}

function readInitialEditorFontFamilyId(): EditorFontFamilyId {
  const saved = readStorageItem(STORAGE_KEY_EDITOR_FONT_FAMILY);
  if (saved && isEditorFontFamilyId(saved)) {
    return saved;
  }

  return DEFAULT_EDITOR_FONT_FAMILY_ID;
}

function readInitialPreviewBackground(isDark: boolean): string {
  const saved = readStorageItem(STORAGE_KEY_PREVIEW_BG);
  if (saved) {
    const normalized = normalizeColor(saved);
    if (isDark && normalized === normalizeColor(DEFAULT_PREVIEW_BG.light)) {
      return DEFAULT_PREVIEW_BG.dark;
    }
    if (!isDark && normalized === normalizeColor(DEFAULT_PREVIEW_BG.dark)) {
      return DEFAULT_PREVIEW_BG.light;
    }
    return saved;
  }

  return isDark ? DEFAULT_PREVIEW_BG.dark : DEFAULT_PREVIEW_BG.light;
}

export function useAppSettings({ source, layout }: AppSettingsOptions) {
  const uiDarkMode = ref(readInitialUiDarkMode());
  const diagramDarkMode = ref(readInitialDiagramDarkMode());
  const editorFontSize = ref<EditorFontSize>(readInitialEditorFontSize());
  const editorFontFamilyId = ref<EditorFontFamilyId>(
    readInitialEditorFontFamilyId(),
  );
  const previewBackground = ref(
    readInitialPreviewBackground(diagramDarkMode.value),
  );

  const editorFontFamily = computed(() =>
    resolveEditorFontFamily(editorFontFamilyId.value),
  );

  function persistSettings(): void {
    writeStorageItem(STORAGE_KEY_SOURCE, source.value);
    writeStorageItem(STORAGE_KEY_UI_DARK, String(uiDarkMode.value));
    writeStorageItem(STORAGE_KEY_DIAGRAM_DARK, String(diagramDarkMode.value));
    writeStorageItem(STORAGE_KEY_LAYOUT, layout.value);
    writeStorageItem(STORAGE_KEY_EDITOR_FONT_SIZE, editorFontSize.value);
    writeStorageItem(STORAGE_KEY_EDITOR_FONT_FAMILY, editorFontFamilyId.value);
    writeStorageItem(STORAGE_KEY_PREVIEW_BG, previewBackground.value);
  }

  function restoreSettings(): void {
    const savedSource = readStorageItem(STORAGE_KEY_SOURCE);
    const savedLayout = readStorageItem(STORAGE_KEY_LAYOUT);

    if (savedSource) {
      source.value = savedSource;
    }

    if (savedLayout && savedLayout in LAYOUT_ENGINES) {
      layout.value = savedLayout as LayoutEngine;
    }
  }

  watch(
    uiDarkMode,
    (isDark) => {
      document.documentElement.dataset.theme = isDark ? "dark" : "light";
    },
    { immediate: true },
  );

  watch(
    diagramDarkMode,
    (isDark, wasDark) => {
      if (wasDark === undefined || wasDark === isDark) {
        return;
      }

      previewBackground.value = isDark
        ? DEFAULT_PREVIEW_BG.dark
        : DEFAULT_PREVIEW_BG.light;
    },
    { immediate: true },
  );

  watch(
    previewBackground,
    (value) => {
      document.documentElement.style.setProperty("--preview-bg", value);
    },
    { immediate: true },
  );

  watch([editorFontSize, editorFontFamilyId, previewBackground, uiDarkMode], () => {
    persistSettings();
  });

  return {
    uiDarkMode,
    diagramDarkMode,
    editorFontSize,
    editorFontFamilyId,
    previewBackground,
    editorFontFamily,
    persistSettings,
    restoreSettings,
  };
}
