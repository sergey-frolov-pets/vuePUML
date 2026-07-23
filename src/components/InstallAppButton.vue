<script setup lang="ts">
import { usePwaInstall } from "@/composables/usePwaInstall";

const { canShowInstallButton, isInstalling, installApp } = usePwaInstall();

const installTitle = "Установить локально на устройство";
</script>

<template>
  <button
    v-if="canShowInstallButton"
    class="btn btn-icon install-app-btn"
    type="button"
    :aria-label="installTitle"
    :title="installTitle"
    :disabled="isInstalling"
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
  width: auto;
  min-width: 40px;
  padding: 0 12px 0 10px;
  gap: 6px;
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 35%, var(--border));
  background: color-mix(in srgb, var(--accent) 8%, var(--surface));
}

.install-app-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent) 14%, var(--surface));
}

.install-app-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.install-app-btn__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.install-app-btn__label {
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1;
}

@media (max-width: 640px) {
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
