<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import AboutModal from "@/components/AboutModal.vue";
import AppDialogHost from "@/components/AppDialogHost.vue";
import DiagramEditor from "@/components/DiagramEditor.vue";
import DiagramPreview from "@/components/DiagramPreview.vue";
import InstallAppButton from "@/components/InstallAppButton.vue";
import UpdateAppButton from "@/components/UpdateAppButton.vue";
import SettingsModal from "@/components/SettingsModal.vue";
import ShareHelpModal from "@/components/ShareHelpModal.vue";
import SyntaxResultModal from "@/components/SyntaxResultModal.vue";
import { APP_META, DEFAULT_SOURCE, LAYOUT_ENGINES } from "@/constants";
import { useAppSettings } from "@/composables/useAppSettings";
import { useDiagramExport } from "@/composables/useDiagramExport";
import { useDiagramRender } from "@/composables/useDiagramRender";
import {
  useImportErrorDialog,
  useIncomingPuml,
} from "@/composables/useIncomingPuml";
import { useSyntaxCheck } from "@/composables/useSyntaxCheck";

const source = ref(DEFAULT_SOURCE);
const layout = ref(LAYOUT_ENGINES.smetana);

const isSettingsModalOpen = ref(false);
const isAboutModalOpen = ref(false);
const isShareHelpModalOpen = ref(false);

const settings = useAppSettings({ source, layout });
const {
  uiDarkMode,
  diagramDarkMode,
  editorFontSize,
  editorFontFamilyId,
  editorFontFamily,
  previewBackground,
  persistSettings,
  restoreSettings,
} = settings;

const render = useDiagramRender({
  source,
  layout,
  diagramDarkMode,
  onPersist: persistSettings,
});
const {
  svg,
  error: renderError,
  isRendering,
  engineReady,
  engineStatus,
  renderDiagram,
  scheduleRender,
  clearRenderError,
  bootEngine,
} = render;

const syntax = useSyntaxCheck({
  source,
  layout,
  diagramDarkMode,
});
const {
  syntaxResult,
  syntaxErrorLines,
  isValidating,
  isSyntaxModalOpen,
  validateSyntax,
  closeSyntaxModal,
  clearSyntaxHighlights,
} = syntax;

const incoming = useIncomingPuml((payload) => {
  source.value = payload.content;
  clearSyntaxHighlights();
  clearRenderError();
  persistSettings();
  scheduleRender();
});
const { loadedFileName, initializeIncomingSources, notifyLoaded, resetLoadedFileName } =
  incoming;

const exportApi = useDiagramExport({
  source,
  svg,
  previewBackground,
  loadedFileName,
  error: renderError,
  isRendering,
});
const { canSave, canExport, savePuml, exportSvg, exportPng } = exportApi;

const { showImportError } = useImportErrorDialog();

function onEditorCleared(): void {
  resetLoadedFileName();
  clearSyntaxHighlights();
  clearRenderError();
  persistSettings();
  scheduleRender();
}

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

watch([source, layout, diagramDarkMode], () => {
  persistSettings();
  scheduleRender();
});

onMounted(() => {
  restoreSettings();
  void initializeIncomingSources();
  void bootEngine();
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
        <UpdateAppButton />
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
        @file-loaded="notifyLoaded"
        @import-error="showImportError"
        @save-puml="savePuml"
        @validate-syntax="validateSyntax"
        @cleared="onEditorCleared"
      />

      <DiagramPreview
        :svg="svg"
        :error="renderError"
        :is-rendering="isRendering"
        :can-export="canExport"
        v-model:preview-background="previewBackground"
        v-model:diagram-dark-mode="diagramDarkMode"
        @render-now="renderDiagram"
        @export-svg="exportSvg"
        @export-png="exportPng"
      />
    </main>

    <footer class="status-bar">
      <span>Файл: {{ loadedFileName }}</span>
      <span class="status-bar__engine">
        <span>Движок: {{ layout }}</span>
        <span
          v-if="engineReady"
          class="status-bar__engine-ok"
          aria-label="Движок готов"
          title="Движок готов"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 12.5 10 16.5 18 7.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span v-else class="status-pill is-error status-pill--inline">{{
          engineStatus
        }}</span>
      </span>
      <span class="status-bar__copyright">{{ APP_META.copyright }}</span>
    </footer>

    <AppDialogHost />

    <SyntaxResultModal
      :open="isSyntaxModalOpen"
      :result="syntaxResult"
      :is-validating="isValidating"
      @close="closeSyntaxModal"
    />

    <SettingsModal
      :open="isSettingsModalOpen"
      v-model:layout="layout"
      v-model:dark-mode="uiDarkMode"
      v-model:editor-font-size="editorFontSize"
      v-model:editor-font-family-id="editorFontFamilyId"
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
