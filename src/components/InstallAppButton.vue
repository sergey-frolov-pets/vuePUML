<script setup lang="ts">
import { computed } from "vue";
import { usePwaInstall } from "@/composables/usePwaInstall";

const {
  canShowInstallButton,
  canInstallNow,
  needsHttps,
  isAlreadyInstalled,
  isInstalling,
  installApp,
} = usePwaInstall();

const installTitle = computed(() => {
  if (needsHttps.value) {
    return "Установка доступна только по HTTPS";
  }

  if (isAlreadyInstalled.value) {
    return "Приложение уже установлено";
  }

  if (!canInstallNow.value) {
    return "Нажмите — покажем подсказку по установке";
  }

  return "Установить приложение";
});
</script>

<template>
  <button
    v-if="canShowInstallButton"
    class="btn install-app-btn"
    :class="{
      'install-app-btn--waiting': !canInstallNow && !needsHttps,
      'install-app-btn--needs-https': needsHttps,
      'install-app-btn--installed': isAlreadyInstalled,
    }"
    type="button"
    :aria-label="installTitle"
    :title="installTitle"
    :disabled="isInstalling"
    :aria-busy="isInstalling"
    @click="installApp"
  >
    <svg class="install-app-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="7"
        y="2.5"
        width="10"
        height="19"
        rx="2"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
      />
      <circle cx="12" cy="18.5" r="0.9" fill="currentColor" />
      <path
        d="M12 14V7M12 14l-2.8-2.8M12 14l2.8-2.8"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span class="install-app-btn__label">Установить</span>
  </button>
</template>

<style scoped>
.install-app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: auto;
  min-width: 40px;
  height: 40px;
  min-height: 40px;
  padding: 0 14px;
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 35%, var(--border));
  background: color-mix(in srgb, var(--accent) 8%, var(--surface));
  white-space: nowrap;
  flex-shrink: 0;
}

.install-app-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent) 14%, var(--surface));
}

.install-app-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.install-app-btn:not(:disabled):not(:hover) {
  opacity: 1;
}

.install-app-btn--waiting {
  opacity: 0.85;
}

.install-app-btn--needs-https {
  border-color: color-mix(in srgb, #c98a00 45%, var(--border));
  background: color-mix(in srgb, #c98a00 10%, var(--surface));
}

.install-app-btn--installed {
  border-color: color-mix(in srgb, var(--success) 35%, var(--border));
  background: color-mix(in srgb, var(--success) 8%, var(--surface));
}

.install-app-btn__icon {
  display: block;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.install-app-btn__label {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
}

@media (max-width: 720px) {
  .install-app-btn__label {
    display: none;
  }

  .install-app-btn {
    width: 40px;
    min-width: 40px;
    padding: 0;
  }
}
</style>
