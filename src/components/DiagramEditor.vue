<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import ActionIcon from "@/components/icons/ActionIcon.vue";
import FileBadgeIcon from "@/components/icons/FileBadgeIcon.vue";
import PanelFullscreenButton from "@/components/PanelFullscreenButton.vue";
import { isSampleDiagramSource, SAMPLE_DIAGRAMS } from "@/constants";
import type { EditorFontSize } from "@/constants/editor-settings";
import {
  loadPumlFromFile,
  PUML_FILE_ACCEPT,
  resolvePumlFileName,
} from "@/utils/puml-files";

const EDITOR_LINE_HEIGHT = 1.45;
const EDITOR_PADDING = "12px";
const GUTTER_PADDING_INLINE = "6px";

const source = defineModel<string>({ required: true });

const props = defineProps<{
  errorLines?: number[];
  editorFontSize: EditorFontSize;
  editorFontFamily: string;
  canSave: boolean;
  isValidating: boolean;
  isRendering: boolean;
}>();

const emit = defineEmits<{
  fileLoaded: [payload: { content: string; fileName: string }];
  importError: [message: string];
  savePuml: [];
  validateSyntax: [];
  cleared: [];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const gutterRef = ref<HTMLTextAreaElement | null>(null);
const highlightsRef = ref<HTMLDivElement | null>(null);
const isDragOver = ref(false);
const isFullscreen = ref(false);

const gutterDigitCount = computed(() => String(lineCount.value).length);

const editorStyle = computed(() => ({
  "--editor-font-size": props.editorFontSize,
  "--editor-font-family": props.editorFontFamily,
  "--editor-line-height": String(EDITOR_LINE_HEIGHT),
  "--editor-padding": EDITOR_PADDING,
  "--gutter-chars": String(gutterDigitCount.value),
  "--gutter-padding-inline": GUTTER_PADDING_INLINE,
}));

const sourceLines = computed(() => source.value.split(/\r?\n/));

const lineCount = computed(() => Math.max(sourceLines.value.length, 1));

const lineNumbersText = computed(() =>
  Array.from({ length: lineCount.value }, (_, index) => String(index + 1)).join(
    "\n",
  ),
);

const errorLineSet = computed(() => new Set(props.errorLines ?? []));

const canClear = computed(() => Boolean(source.value.trim()));

function requestClear(): void {
  if (!canClear.value) {
    return;
  }

  if (isSampleDiagramSource(source.value)) {
    clearEditor();
    return;
  }

  if (
    window.confirm("Очистить редактор? Текущий код будет удалён.")
  ) {
    clearEditor();
  }
}

function clearEditor(): void {
  source.value = "";
  emit("cleared");
}

function loadSample(name: string): void {
  const sample = SAMPLE_DIAGRAMS[name];
  if (sample) {
    source.value = sample;
    emit("fileLoaded", {
      content: sample,
      fileName: resolvePumlFileName(`${name}.puml`),
    });
  }
}

function openFilePicker(): void {
  fileInputRef.value?.click();
}

async function handleSelectedFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";

  if (!file) {
    return;
  }

  await importFile(file);
}

async function importFile(file: File): Promise<void> {
  try {
    const loaded = await loadPumlFromFile(file);
    source.value = loaded.content;
    emit("fileLoaded", loaded);
  } catch (importError) {
    emit(
      "importError",
      importError instanceof Error
        ? importError.message
        : "Не удалось открыть файл",
    );
  }
}

function onDragOver(event: DragEvent): void {
  event.preventDefault();
  isDragOver.value = true;
}

function onDragLeave(): void {
  isDragOver.value = false;
}

async function onDrop(event: DragEvent): Promise<void> {
  event.preventDefault();
  isDragOver.value = false;

  const file = event.dataTransfer?.files?.[0];
  if (!file) {
    return;
  }

  await importFile(file);
}

function syncScroll(): void {
  const textarea = textareaRef.value;
  if (!textarea) {
    return;
  }

  if (gutterRef.value) {
    gutterRef.value.scrollTop = textarea.scrollTop;
  }

  if (highlightsRef.value) {
    highlightsRef.value.scrollTop = textarea.scrollTop;
    highlightsRef.value.scrollLeft = textarea.scrollLeft;
  }
}

function toggleFullscreen(): void {
  isFullscreen.value = !isFullscreen.value;
}

function onFullscreenKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape" && isFullscreen.value) {
    isFullscreen.value = false;
  }
}

watch(isFullscreen, (value) => {
  document.body.style.overflow = value ? "hidden" : "";
});

onMounted(() => {
  window.addEventListener("keydown", onFullscreenKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onFullscreenKeydown);
  document.body.style.overflow = "";
});

watch(
  () => source.value,
  async () => {
    await nextTick();
    syncScroll();
  },
);
</script>

<template>
  <section
    class="panel editor-panel panel--corner-controls"
    :class="{ 'is-fullscreen': isFullscreen }"
    :style="editorStyle"
  >
    <PanelFullscreenButton :active="isFullscreen" @toggle="toggleFullscreen" />

    <header class="panel-header">
      <h2 class="panel-title">Исходный код PlantUML</h2>
      <div class="header-actions">
        <button
          class="btn btn-icon"
          type="button"
          title="Открыть .puml"
          aria-label="Открыть .puml"
          @click="openFilePicker"
        >
          <ActionIcon name="folder-open" />
        </button>
        <button
          class="btn btn-icon btn-primary"
          type="button"
          title="Сохранить .puml"
          aria-label="Сохранить .puml"
          :disabled="!canSave"
          @click="emit('savePuml')"
        >
          <FileBadgeIcon format="PUML" />
        </button>
        <button
          class="btn btn-icon"
          type="button"
          :title="isValidating ? 'Проверка...' : 'Проверить синтаксис'"
          :aria-label="isValidating ? 'Проверка...' : 'Проверить синтаксис'"
          :disabled="isValidating || isRendering"
          @click="emit('validateSyntax')"
        >
          <ActionIcon name="check" />
        </button>
        <button
          class="btn btn-icon"
          type="button"
          title="Очистить"
          aria-label="Очистить"
          :disabled="!canClear"
          @click="requestClear"
        >
          <ActionIcon name="trash" />
        </button>
        <label>
          <span class="sr-only">Пример диаграммы</span>
          <select
            class="select sample-select"
            @change="loadSample(($event.target as HTMLSelectElement).value)"
          >
            <option value="" selected disabled>Примеры</option>
            <option
              v-for="name in Object.keys(SAMPLE_DIAGRAMS)"
              :key="name"
              :value="name"
            >
              {{ name }}
            </option>
          </select>
        </label>
      </div>
    </header>

    <div
      class="panel-body editor-dropzone"
      :class="{ 'is-drag-over': isDragOver }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <input
        ref="fileInputRef"
        class="sr-only"
        type="file"
        :accept="PUML_FILE_ACCEPT"
        @change="handleSelectedFile"
      />

      <div class="code-editor">
        <textarea
          ref="gutterRef"
          class="code-editor__gutter"
          :value="lineNumbersText"
          readonly
          tabindex="-1"
          aria-hidden="true"
        />

        <div class="code-editor__input-wrap">
          <div
            ref="highlightsRef"
            class="code-editor__highlights"
            aria-hidden="true"
          >
            <div
              v-for="(line, index) in sourceLines"
              :key="index"
              class="code-editor__line"
              :class="{ 'is-error': errorLineSet.has(index + 1) }"
            >
              {{ line || " " }}
            </div>
          </div>
          <textarea
            ref="textareaRef"
            v-model="source"
            class="code-editor__textarea"
            wrap="off"
            spellcheck="false"
            autocomplete="off"
            autocapitalize="off"
            placeholder="@startuml&#10;Alice -> Bob : Hello&#10;@enduml"
            @scroll="syncScroll"
          />
        </div>
      </div>

      <p class="drop-hint">
        Перетащите .puml сюда. На Android через «Поделиться» — см. кнопку
        «Как передать .puml» в шапке.
      </p>
    </div>
  </section>
</template>

<style scoped>
.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.sample-select {
  width: auto;
  min-width: 180px;
}

.editor-panel.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 900;
  border-radius: 0;
  margin: 0;
}

.editor-panel.is-fullscreen .panel-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.editor-panel.is-fullscreen .code-editor {
  flex: 1;
  min-height: 0;
}

.editor-panel.is-fullscreen .code-editor {
  flex: 1;
  min-height: 0;
}

.editor-panel.is-fullscreen .code-editor__input-wrap {
  min-height: 0;
}

.editor-panel.is-fullscreen .code-editor__gutter,
.editor-panel.is-fullscreen .code-editor__textarea {
  min-height: 0;
}

.editor-dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.editor-dropzone.is-drag-over .code-editor {
  outline: 2px solid color-mix(in srgb, var(--accent) 35%, transparent);
}

.code-editor {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  min-height: 320px;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface);
}

.code-editor__gutter,
.code-editor__highlights,
.code-editor__textarea {
  box-sizing: border-box;
  margin: 0;
  padding: var(--editor-padding);
  border: 0;
  font-family: var(--editor-font-family, var(--font-mono));
  font-size: var(--editor-font-size);
  line-height: var(--editor-line-height);
  tab-size: 2;
  white-space: pre;
  overflow: auto;
}

.code-editor__gutter {
  flex: 0 0 auto;
  align-self: stretch;
  width: calc(
    var(--gutter-chars) * 1ch + var(--gutter-padding-inline) * 2
  );
  min-height: 320px;
  padding-inline: var(--gutter-padding-inline);
  border-right: 1px solid var(--border);
  background: var(--surface-muted);
  color: var(--text-muted);
  text-align: right;
  resize: none;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
}

.code-editor__gutter:focus {
  outline: none;
}

.code-editor__input-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 320px;
}

.code-editor__highlights {
  position: absolute;
  inset: 0;
  pointer-events: none;
  color: transparent;
  background: transparent;
}

.code-editor__line {
  display: block;
  white-space: pre;
}

.code-editor__line.is-error {
  background: color-mix(in srgb, var(--danger) 14%, transparent);
}

.code-editor__textarea {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  min-height: 320px;
  resize: vertical;
  background: transparent;
  color: var(--text);
}

.drop-hint {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
