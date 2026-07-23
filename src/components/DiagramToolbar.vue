<script setup lang="ts">
import { LAYOUT_ENGINES, type LayoutEngine } from "@/constants";
import { DEFAULT_PREVIEW_BG } from "@/constants/editor-settings";

const props = defineProps<{
  isRendering: boolean;
  canExport: boolean;
  layout: LayoutEngine;
  previewBackground: string;
  diagramDarkMode: boolean;
}>();

const emit = defineEmits<{
  exportSvg: [];
  exportPng: [];
  renderNow: [];
  "update:layout": [value: LayoutEngine];
  "update:previewBackground": [value: string];
  "update:diagramDarkMode": [value: boolean];
}>();

const layoutOptions = Object.entries(LAYOUT_ENGINES).map(([label, value]) => ({
  label,
  value,
}));

function resetPreviewBackground(isDark: boolean): void {
  emit(
    "update:previewBackground",
    isDark ? DEFAULT_PREVIEW_BG.dark : DEFAULT_PREVIEW_BG.light,
  );
}

function toggleDiagramTheme(): void {
  emit("update:diagramDarkMode", !props.diagramDarkMode);
}
</script>

<template>
  <div class="preview-toolbar">
    <label class="preview-toolbar__field">
      <span class="sr-only">Движок раскладки</span>
      <select
        class="select preview-toolbar__select"
        :value="layout"
        title="Движок раскладки"
        @change="
          emit(
            'update:layout',
            ($event.target as HTMLSelectElement).value as LayoutEngine,
          )
        "
      >
        <option
          v-for="option in layoutOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </label>

    <label class="preview-toolbar__field preview-toolbar__field--color" title="Фон предпросмотра">
      <span class="sr-only">Фон предпросмотра</span>
      <input
        class="preview-toolbar__color"
        type="color"
        :value="previewBackground"
        @input="
          emit(
            'update:previewBackground',
            ($event.target as HTMLInputElement).value,
          )
        "
      />
      <button
        class="btn preview-toolbar__reset"
        type="button"
        title="Сбросить фон"
        @click="resetPreviewBackground(diagramDarkMode)"
      >
        ↺
      </button>
    </label>

    <button
      class="btn preview-toolbar__theme"
      type="button"
      :aria-pressed="diagramDarkMode"
      :title="
        diagramDarkMode
          ? 'Переключить на светлую тему диаграммы'
          : 'Переключить на тёмную тему диаграммы'
      "
      @click="toggleDiagramTheme"
    >
      {{ diagramDarkMode ? "Светлая" : "Тёмная" }}
    </button>

    <button
      class="btn"
      type="button"
      :disabled="isRendering"
      @click="emit('renderNow')"
    >
      Обновить
    </button>
    <button
      class="btn btn-primary"
      type="button"
      :disabled="!canExport"
      @click="emit('exportSvg')"
    >
      SVG
    </button>
    <button
      class="btn btn-primary"
      type="button"
      :disabled="!canExport"
      @click="emit('exportPng')"
    >
      PNG
    </button>
  </div>
</template>

<style scoped>
.preview-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.preview-toolbar__field {
  display: inline-flex;
  align-items: center;
  margin: 0;
}

.preview-toolbar__field--color {
  gap: 4px;
}

.preview-toolbar__select {
  width: auto;
  min-width: 108px;
  min-height: 40px;
}

.preview-toolbar__color {
  width: 40px;
  height: 40px;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  cursor: pointer;
}

.preview-toolbar__reset {
  min-width: 40px;
  min-height: 40px;
  padding: 0;
  font-size: 1.1rem;
  line-height: 1;
}

.preview-toolbar__theme[aria-pressed="true"] {
  background: color-mix(in srgb, var(--accent) 14%, var(--surface));
  border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
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
