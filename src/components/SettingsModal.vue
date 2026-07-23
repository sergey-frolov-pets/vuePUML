<script setup lang="ts">
import AppModal from "@/components/AppModal.vue";
import { APP_LINKS } from "@/constants";
import {
  EDITOR_FONT_FAMILY_OPTIONS,
  EDITOR_FONT_SIZE_OPTIONS,
  type EditorFontFamilyId,
  type EditorFontSize,
} from "@/constants/editor-settings";

defineProps<{
  open: boolean;
  darkMode: boolean;
  editorFontSize: EditorFontSize;
  editorFontFamilyId: EditorFontFamilyId;
}>();

const emit = defineEmits<{
  close: [];
  "update:darkMode": [value: boolean];
  "update:editorFontSize": [value: EditorFontSize];
  "update:editorFontFamilyId": [value: EditorFontFamilyId];
  openShareHelp: [];
  openAbout: [];
}>();
</script>

<template>
  <AppModal :open="open" title="Настройки" @close="emit('close')">
    <div class="settings-section">
      <h3 class="settings-section__title">Редактор</h3>

      <label class="settings-field">
        <span class="settings-field__label">Размер шрифта</span>
        <select
          class="select"
          :value="editorFontSize"
          @change="
            emit(
              'update:editorFontSize',
              ($event.target as HTMLSelectElement).value as EditorFontSize,
            )
          "
        >
          <option
            v-for="option in EDITOR_FONT_SIZE_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="settings-field">
        <span class="settings-field__label">Шрифт</span>
        <select
          class="select"
          :value="editorFontFamilyId"
          @change="
            emit(
              'update:editorFontFamilyId',
              ($event.target as HTMLSelectElement).value as EditorFontFamilyId,
            )
          "
        >
          <option
            v-for="option in EDITOR_FONT_FAMILY_OPTIONS"
            :key="option.id"
            :value="option.id"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <div class="settings-section">
      <h3 class="settings-section__title">Тема интерфейса</h3>

      <label class="settings-field settings-field--checkbox">
        <input
          type="checkbox"
          :checked="darkMode"
          @change="
            emit(
              'update:darkMode',
              ($event.target as HTMLInputElement).checked,
            )
          "
        />
        <span>Тёмная тема</span>
      </label>
    </div>

    <div class="settings-section">
      <h3 class="settings-section__title">Справка</h3>
      <div class="settings-links">
        <button
          class="btn settings-link-btn"
          type="button"
          @click="emit('openShareHelp')"
        >
          Как передать .puml
        </button>
        <a
          class="btn settings-link-btn"
          :href="APP_LINKS.plantumlGuide"
          target="_blank"
          rel="noopener noreferrer"
        >
          Справка PlantUML
        </a>
        <button
          class="btn settings-link-btn"
          type="button"
          @click="emit('openAbout')"
        >
          О программе
        </button>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-primary" type="button" @click="emit('close')">
        Готово
      </button>
    </template>
  </AppModal>
</template>

<style scoped>
.settings-section + .settings-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.settings-section__title {
  margin: 0 0 12px;
  font-size: 0.92rem;
  font-weight: 600;
}

.settings-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.settings-field__label {
  font-size: 0.88rem;
  color: var(--text-muted);
}

.settings-field--checkbox {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  color: var(--text);
}

.settings-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settings-link-btn {
  width: 100%;
  justify-content: flex-start;
  text-decoration: none;
  color: var(--text);
}
</style>
