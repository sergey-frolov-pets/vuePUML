<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import AboutModal from "@/components/AboutModal.vue";
import DiagramEditor from "@/components/DiagramEditor.vue";
import DiagramPreview from "@/components/DiagramPreview.vue";
import DiagramToolbar from "@/components/DiagramToolbar.vue";
import InstallAppButton from "@/components/InstallAppButton.vue";
import SettingsModal from "@/components/SettingsModal.vue";
import ShareHelpModal from "@/components/ShareHelpModal.vue";
import SyntaxResultModal from "@/components/SyntaxResultModal.vue";
import {
  APP_META,
  DEFAULT_SOURCE,
  LAYOUT_ENGINES,
  RENDER_DEBOUNCE_MS,
  STORAGE_KEY_DARK,
  STORAGE_KEY_LAYOUT,
  STORAGE_KEY_SOURCE,
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
import {
  isVizGlobalReady,
  renderPlantUmlToSvg,
  validatePlantUmlSyntax,
  waitForEngineReady,
} from "@/composables/usePlantUml";
import {
  consumeSharedLaunch,
  registerShareSupport,
  setupLaunchQueue,
} from "@/composables/usePumlShare";
import {
  applyLayoutPragma,
  splitSourceLines,
} from "@/utils/plantuml-source";
import {
  downloadBlob,
  downloadTextFile,
  svgToPngBlob,
} from "@/utils/export";
import { savePumlSource } from "@/utils/puml-files";
import type { SyntaxCheckResult } from "@/utils/plantuml-syntax";

const source = ref(DEFAULT_SOURCE);
const layout = ref<LayoutEngine>(LAYOUT_ENGINES.smetana);
function readInitialDarkMode(): boolean {
  try {
    const savedDark = localStorage.getItem(STORAGE_KEY_DARK);
    if (savedDark !== null) {
      return savedDark === "true";
    }
  } catch {
    // file:// может блокировать localStorage
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

const darkMode = ref(readInitialDarkMode());
const editorFontSize = ref<EditorFontSize>(readInitialEditorFontSize());
const editorFontFamilyId = ref<EditorFontFamilyId>(readInitialEditorFontFamilyId());
const previewBackground = ref(readInitialPreviewBackground(darkMode.value));
const editorFontFamily = computed(() =>
  resolveEditorFontFamily(editorFontFamilyId.value),
);
const svg = ref("");
const error = ref("");
const isRendering = ref(false);
const isValidating = ref(false);
const engineReady = ref(false);
const engineStatus = ref("Загрузка движка PlantUML...");
const loadedFileName = ref("diagram.puml");
const syntaxResult = ref<SyntaxCheckResult | null>(null);
const syntaxErrorLines = ref<number[]>([]);
const isSyntaxModalOpen = ref(false);
const isSettingsModalOpen = ref(false);
const isAboutModalOpen = ref(false);
const isShareHelpModalOpen = ref(false);

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

const canExport = computed(() => Boolean(svg.value) && !error.value && !isRendering.value);
const canSave = computed(() => Boolean(source.value.trim()));

function readInitialEditorFontSize(): EditorFontSize {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EDITOR_FONT_SIZE);
    if (saved && isEditorFontSize(saved)) {
      return saved;
    }
  } catch {
    // file:// может блокировать localStorage
  }

  return DEFAULT_EDITOR_FONT_SIZE;
}

function readInitialEditorFontFamilyId(): EditorFontFamilyId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EDITOR_FONT_FAMILY);
    if (saved && isEditorFontFamilyId(saved)) {
      return saved;
    }
  } catch {
    // file:// может блокировать localStorage
  }

  return DEFAULT_EDITOR_FONT_FAMILY_ID;
}

function normalizeColor(value: string): string {
  return value.trim().toLowerCase();
}

function readInitialPreviewBackground(isDark: boolean): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREVIEW_BG);
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
  } catch {
    // file:// может блокировать localStorage
  }

  return isDark ? DEFAULT_PREVIEW_BG.dark : DEFAULT_PREVIEW_BG.light;
}

function persistSettings(): void {
  try {
    localStorage.setItem(STORAGE_KEY_SOURCE, source.value);
    localStorage.setItem(STORAGE_KEY_DARK, String(darkMode.value));
    localStorage.setItem(STORAGE_KEY_LAYOUT, layout.value);
    localStorage.setItem(STORAGE_KEY_EDITOR_FONT_SIZE, editorFontSize.value);
    localStorage.setItem(STORAGE_KEY_EDITOR_FONT_FAMILY, editorFontFamilyId.value);
    localStorage.setItem(STORAGE_KEY_PREVIEW_BG, previewBackground.value);
  } catch {
    // file:// может блокировать localStorage
  }
}

function restoreSettings(): void {
  try {
    const savedSource = localStorage.getItem(STORAGE_KEY_SOURCE);
    const savedLayout = localStorage.getItem(STORAGE_KEY_LAYOUT);

    if (savedSource) {
      source.value = savedSource;
    }

    if (savedLayout && savedLayout in LAYOUT_ENGINES) {
      layout.value = savedLayout as LayoutEngine;
    }
  } catch {
    // file:// может блокировать localStorage
  }
}

async function renderDiagram(): Promise<void> {
  if (!engineReady.value) {
    error.value = "Движок PlantUML ещё не загружен";
    return;
  }

  isRendering.value = true;
  error.value = "";

  try {
    const prepared = applyLayoutPragma(source.value, layout.value);
    const lines = splitSourceLines(prepared);
    const result = await renderPlantUmlToSvg(lines, { dark: darkMode.value });
    svg.value = result;
  } catch (renderError) {
    svg.value = "";
    error.value =
      renderError instanceof Error
        ? renderError.message
        : "Неизвестная ошибка рендеринга";
  } finally {
    isRendering.value = false;
  }
}

function applyLoadedSource(content: string, fileName: string): void {
  source.value = content;
  loadedFileName.value = fileName;
  error.value = "";
  syntaxErrorLines.value = [];
  persistSettings();
  scheduleRender();
}

function onFileLoaded(payload: { content: string; fileName: string }): void {
  applyLoadedSource(payload.content, payload.fileName);
}

function onImportError(message: string): void {
  error.value = message;
}

function onEditorCleared(): void {
  loadedFileName.value = "diagram.puml";
  syntaxErrorLines.value = [];
  error.value = "";
  persistSettings();
  scheduleRender();
}

async function initializeIncomingSources(): Promise<void> {
  setupLaunchQueue((payload) => {
    applyLoadedSource(payload.content, payload.fileName);
  });

  const shared = await consumeSharedLaunch();
  if (shared) {
    applyLoadedSource(shared.content, shared.fileName);
  }
}

function scheduleRender(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    void renderDiagram();
  }, RENDER_DEBOUNCE_MS);
}

function updateSyntaxHighlights(result: SyntaxCheckResult | null): void {
  if (!result || result.valid) {
    syntaxErrorLines.value = [];
    return;
  }

  syntaxErrorLines.value = [
    ...new Set(
      result.issues
        .map((issue) => issue.line)
        .filter((line): line is number => typeof line === "number"),
    ),
  ];
}

function savePuml(): void {
  if (!canSave.value) {
    return;
  }

  savePumlSource(source.value, loadedFileName.value);
}

async function validateSyntax(): Promise<void> {
  isSyntaxModalOpen.value = true;
  isValidating.value = true;
  syntaxResult.value = null;

  try {
    const result = await validatePlantUmlSyntax(
      source.value,
      layout.value,
      darkMode.value,
    );
    syntaxResult.value = result;
    updateSyntaxHighlights(result);
  } finally {
    isValidating.value = false;
  }
}

function closeSyntaxModal(): void {
  isSyntaxModalOpen.value = false;
}

function exportSvg(): void {
  if (!svg.value) {
    return;
  }
  downloadTextFile(svg.value, "diagram.svg", "image/svg+xml;charset=utf-8");
}

async function exportPng(): Promise<void> {
  if (!svg.value) {
    return;
  }

  try {
    const background = previewBackground.value;
    const pngBlob = await svgToPngBlob(svg.value, background);
    downloadBlob(pngBlob, "diagram.png");
  } catch (exportError) {
    error.value =
      exportError instanceof Error
        ? exportError.message
        : "Не удалось экспортировать PNG";
  }
}

watch(
  darkMode,
  (isDark, wasDark) => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";

    if (wasDark === undefined || wasDark === isDark) {
      return;
    }

    const previousDefault = wasDark
      ? DEFAULT_PREVIEW_BG.dark
      : DEFAULT_PREVIEW_BG.light;
    const nextDefault = isDark
      ? DEFAULT_PREVIEW_BG.dark
      : DEFAULT_PREVIEW_BG.light;

    if (
      normalizeColor(previewBackground.value) === normalizeColor(previousDefault)
    ) {
      previewBackground.value = nextDefault;
    }
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

watch([source, layout, darkMode], () => {
  persistSettings();
  scheduleRender();
});

watch([editorFontSize, editorFontFamilyId, previewBackground], () => {
  persistSettings();
});

watch(source, () => {
  if (syntaxErrorLines.value.length > 0) {
    syntaxErrorLines.value = [];
  }
});

function openSettingsModal(): void {
  isSettingsModalOpen.value = true;
}

function openShareHelpFromSettings(): void {
  isSettingsModalOpen.value = false;
  isShareHelpModalOpen.value = true;
}

function openAboutFromSettings(): void {
  isSettingsModalOpen.value = false;
  isAboutModalOpen.value = true;
}

onMounted(() => {
  restoreSettings();
  void registerShareSupport();
  void initializeIncomingSources();
  void waitForEngineReady()
    .then(() => {
      engineReady.value = isVizGlobalReady();
      engineStatus.value = engineReady.value
        ? "Движок готов"
        : "Движок не инициализировался";
      scheduleRender();
    })
    .catch((bootError) => {
      engineReady.value = false;
      engineStatus.value =
        bootError instanceof Error
          ? bootError.message
          : "Ошибка загрузки движка";
      error.value = engineStatus.value;
    });
});
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header__main">
        <h1>{{ APP_META.name }}</h1>
        <p>Кросс-платформенный офлайн генератор PlantUML диаграмм</p>
      </div>
      <nav class="app-header__nav" aria-label="Настройки">
        <InstallAppButton />
        <button
          class="btn app-header__settings-btn"
          type="button"
          aria-label="Настройки"
          title="Настройки"
          @click="openSettingsModal"
        >
          ⚙
        </button>
      </nav>
    </header>

    <main class="app-main">
      <DiagramEditor
        v-model="source"
        :error-lines="syntaxErrorLines"
        :editor-font-size="editorFontSize"
        :editor-font-family="editorFontFamily"
        :can-save="canSave"
        :is-validating="isValidating"
        :is-rendering="isRendering"
        @file-loaded="onFileLoaded"
        @import-error="onImportError"
        @save-puml="savePuml"
        @validate-syntax="validateSyntax"
        @cleared="onEditorCleared"
      />

      <section class="panel">
        <header class="panel-header">
          <h2 class="panel-title">Экспорт</h2>
          <DiagramToolbar
            :is-rendering="isRendering"
            :can-export="canExport"
            @render-now="renderDiagram"
            @export-svg="exportSvg"
            @export-png="exportPng"
          />
        </header>

        <DiagramPreview
          :svg="svg"
          :error="error"
          :is-rendering="isRendering"
        />
      </section>
    </main>

    <footer class="status-bar">
      <span
        class="status-pill"
        :class="engineReady ? 'is-ready' : 'is-error'"
      >
        {{ engineReady ? "Движок готов" : engineStatus }}
      </span>
      <span>Файл: {{ loadedFileName }}</span>
      <span>Раскладка: {{ layout }}</span>
      <span>Режим: {{ darkMode ? "тёмный" : "светлый" }}</span>
      <span class="status-bar__copyright">{{ APP_META.copyright }}</span>
    </footer>

    <SyntaxResultModal
      :open="isSyntaxModalOpen"
      :result="syntaxResult"
      :is-validating="isValidating"
      @close="closeSyntaxModal"
    />

    <SettingsModal
      :open="isSettingsModalOpen"
      v-model:layout="layout"
      v-model:dark-mode="darkMode"
      v-model:editor-font-size="editorFontSize"
      v-model:editor-font-family-id="editorFontFamilyId"
      v-model:preview-background="previewBackground"
      @close="isSettingsModalOpen = false"
      @open-share-help="openShareHelpFromSettings"
      @open-about="openAboutFromSettings"
    />

    <AboutModal
      :open="isAboutModalOpen"
      @close="isAboutModalOpen = false"
    />

    <ShareHelpModal
      :open="isShareHelpModalOpen"
      @close="isShareHelpModalOpen = false"
    />
  </div>
</template>

<style scoped>
.app-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.app-header__main {
  flex: 1;
  min-width: 220px;
}

.app-header__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.app-header__settings-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  min-width: 40px;
  padding: 0;
  font-size: 1.25rem;
  line-height: 1;
}
</style>
