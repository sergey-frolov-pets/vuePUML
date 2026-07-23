<script setup lang="ts">
const props = defineProps<{
  isRendering: boolean;
  canExport: boolean;
  previewBackground: string;
  diagramDarkMode: boolean;
}>();

const emit = defineEmits<{
  exportSvg: [];
  exportPng: [];
  renderNow: [];
  "update:previewBackground": [value: string];
  "update:diagramDarkMode": [value: boolean];
}>();

function toggleDiagramTheme(): void {
  emit("update:diagramDarkMode", !props.diagramDarkMode);
}
</script>

<template>
  <div class="preview-toolbar">
    <label
      class="preview-toolbar__color-field"
      title="Фон предпросмотра"
    >
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
    </label>

    <button
      class="btn btn-icon"
      type="button"
      :aria-pressed="diagramDarkMode"
      :title="
        diagramDarkMode
          ? 'Переключить на светлую тему диаграммы'
          : 'Переключить на тёмную тему диаграммы'
      "
      :aria-label="
        diagramDarkMode
          ? 'Переключить на светлую тему диаграммы'
          : 'Переключить на тёмную тему диаграммы'
      "
      @click="toggleDiagramTheme"
    >
      <svg
        v-if="diagramDarkMode"
        class="btn-icon__svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="4"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        />
        <path
          d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
      <svg
        v-else
        class="btn-icon__svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <button
      class="btn btn-icon"
      type="button"
      title="Обновить"
      aria-label="Обновить"
      :disabled="isRendering"
      @click="emit('renderNow')"
    >
      <svg class="btn-icon__svg" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M20 12a8 8 0 1 1-2.3-5.7M20 4v6h-6"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <button
      class="btn btn-icon btn-primary"
      type="button"
      title="Экспорт SVG"
      aria-label="Экспорт SVG"
      :disabled="!canExport"
      @click="emit('exportSvg')"
    >
      <svg class="btn-icon__svg" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <path
          d="M14 3v5h5M8 13h8M8 17h5"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>

    <button
      class="btn btn-icon btn-primary"
      type="button"
      title="Экспорт PNG"
      aria-label="Экспорт PNG"
      :disabled="!canExport"
      @click="emit('exportPng')"
    >
      <svg class="btn-icon__svg" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        />
        <circle cx="9" cy="10" r="2" fill="currentColor" />
        <path
          d="m21 15-5-5L5 21"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.preview-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.preview-toolbar__color-field {
  display: inline-flex;
  margin: 0;
}

.preview-toolbar__color {
  box-sizing: border-box;
  width: 36px;
  height: 36px;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  cursor: pointer;
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
