<script setup lang="ts">
import AppModal from "@/components/AppModal.vue";
import { APP_META } from "@/constants";
import { SHARE_PUML_STEPS, SHARE_PUML_TIPS } from "@/constants/share-help";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <AppModal :open="open" title="Как передать .puml через «Поделиться»" @close="emit('close')">
    <p class="intro">
      Чтобы открывать диаграммы из других приложений Android, установите
      <strong>{{ APP_META.name }}</strong> как PWA и передайте файл через системное
      меню «Поделиться».
    </p>

    <ol class="steps">
      <li v-for="(step, index) in SHARE_PUML_STEPS" :key="step.title">
        <h3>{{ index + 1 }}. {{ step.title }}</h3>
        <ul>
          <li v-for="detail in step.details" :key="detail">{{ detail }}</li>
        </ul>
      </li>
    </ol>

    <h3 class="tips-title">Если не работает</h3>
    <ul class="tips">
      <li v-for="tip in SHARE_PUML_TIPS" :key="tip">{{ tip }}</li>
    </ul>

    <template #footer>
      <button class="btn btn-primary" type="button" @click="emit('close')">
        Понятно
      </button>
    </template>
  </AppModal>
</template>

<style scoped>
.intro {
  margin: 0 0 16px;
  line-height: 1.5;
}

.steps {
  margin: 0;
  padding-left: 1.2rem;
}

.steps li {
  margin-bottom: 14px;
}

.steps h3 {
  margin: 0 0 6px;
  font-size: 0.95rem;
}

.steps ul {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.tips-title {
  margin: 18px 0 8px;
  font-size: 0.92rem;
}

.tips {
  margin: 0;
  padding-left: 1.2rem;
  line-height: 1.5;
  color: var(--text-muted);
}
</style>
