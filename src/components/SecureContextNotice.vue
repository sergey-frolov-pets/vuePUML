<script setup lang="ts">
import { computed } from "vue";
import {
  isFileProtocol,
  isPwaInstallSupported,
} from "@/pwa/installPromptState";

const showNotice = computed(
  () => !isFileProtocol() && !isPwaInstallSupported(),
);
</script>

<template>
  <div v-if="showNotice" class="secure-context-notice" role="status">
    <p>
      Сайт открыт по <strong>HTTP</strong>. Установка PWA и service worker
      работают только по <strong>HTTPS</strong>.
    </p>
    <p class="secure-context-notice__hint">
      GitHub → Settings → Pages → Custom domain → дождитесь проверки DNS и
      включите «Enforce HTTPS» для <code>puml.sergey-frolov.ru</code>.
    </p>
  </div>
</template>

<style scoped>
.secure-context-notice {
  padding: 10px 14px;
  border: 1px solid color-mix(in srgb, var(--warning, #c98a00) 45%, var(--border));
  border-radius: 10px;
  background: color-mix(in srgb, var(--warning, #c98a00) 10%, var(--surface));
  color: var(--text);
  font-size: 0.875rem;
  line-height: 1.45;
}

.secure-context-notice p {
  margin: 0;
}

.secure-context-notice__hint {
  margin-top: 6px;
  color: var(--muted);
}

.secure-context-notice code {
  font-size: 0.8125rem;
}
</style>
