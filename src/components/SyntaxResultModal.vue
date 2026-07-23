<script setup lang="ts">
import { computed } from "vue";
import AppModal from "@/components/AppModal.vue";
import type { SyntaxCheckResult } from "@/utils/plantuml-syntax";
import {
  extractSyntaxErrorLines,
  formatSyntaxIssues,
} from "@/utils/plantuml-syntax";

const props = defineProps<{
  open: boolean;
  result: SyntaxCheckResult | null;
  isValidating: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const title = computed(() => {
  if (props.isValidating) {
    return "Проверка синтаксиса";
  }
  if (!props.result) {
    return "Проверка синтаксиса";
  }
  return props.result.valid ? "Синтаксис корректен" : "Ошибки синтаксиса";
});

const variant = computed(() => {
  if (props.isValidating || !props.result) {
    return "default";
  }
  return props.result.valid ? "success" : "error";
});

const message = computed(() => {
  if (props.isValidating) {
    return "Проверяем исходник через статический анализ и движок PlantUML…";
  }
  if (!props.result) {
    return "";
  }
  if (props.result.valid) {
    return "Диаграмма успешно прошла проверку. Можно экспортировать SVG или PNG.";
  }
  return formatSyntaxIssues(props.result.issues);
});

const errorLines = computed(() => extractSyntaxErrorLines(props.result));
</script>

<template>
  <AppModal
    :open="open"
    :title="title"
    :variant="variant"
    @close="emit('close')"
  >
    <p class="syntax-message">{{ message }}</p>

    <ul v-if="!isValidating && result && !result.valid" class="issue-list">
      <li
        v-for="(issue, index) in result.issues"
        :key="`${issue.message}-${index}`"
        :class="issue.severity"
      >
        <span v-if="issue.line" class="issue-line">Строка {{ issue.line }}</span>
        {{ issue.message }}
      </li>
    </ul>

    <p
      v-if="!isValidating && result && !result.valid && errorLines.length > 0"
      class="syntax-hint"
    >
      Проблемные строки подсвечены в редакторе:
      {{ errorLines.join(", ") }}
    </p>

    <template #footer>
      <button class="btn btn-primary" type="button" @click="emit('close')">
        {{ isValidating ? "Подождите…" : "Закрыть" }}
      </button>
    </template>
  </AppModal>
</template>

<style scoped>
.syntax-message {
  margin: 0 0 12px;
  white-space: pre-wrap;
  line-height: 1.5;
}

.issue-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.issue-list li {
  padding: 8px 10px;
  border-radius: 8px;
  margin-bottom: 6px;
  background: var(--surface-muted);
}

.issue-list li.error {
  border-left: 3px solid var(--danger);
}

.issue-list li.warning {
  border-left: 3px solid #d4a017;
}

.issue-line {
  display: block;
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.syntax-hint {
  margin: 12px 0 0;
  font-size: 0.88rem;
  color: var(--text-muted);
}
</style>
