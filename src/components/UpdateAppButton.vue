<script setup lang="ts">
import { usePwaUpdate } from "@/composables/usePwaUpdate";

const { canShowUpdateButton, updateAvailable, isUpdating, updateApp } =
  usePwaUpdate();

const updateTitle = "Обновить приложение";
</script>

<template>
  <button
    v-if="canShowUpdateButton"
    class="btn update-app-btn"
    :class="{ 'update-app-btn--pending': updateAvailable }"
    type="button"
    :aria-label="updateTitle"
    :title="updateTitle"
    :disabled="isUpdating"
    @click="updateApp"
  >
    <svg class="update-app-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M17.65 6.35A8 8 0 1 0 19.24 12"
        fill="none"
        stroke="currentColor"
        stroke-width="1.9"
        stroke-linecap="round"
      />
      <path
        d="M19 2v6h-6"
        fill="none"
        stroke="currentColor"
        stroke-width="1.9"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span class="update-app-btn__label">Обновить</span>
    <span v-if="updateAvailable" class="update-app-btn__badge" aria-hidden="true" />
  </button>
</template>

<style scoped>
.update-app-btn {
  position: relative;
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

.update-app-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent) 14%, var(--surface));
}

.update-app-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.update-app-btn--pending {
  border-color: color-mix(in srgb, var(--success) 45%, var(--border));
  background: color-mix(in srgb, var(--success) 10%, var(--surface));
}

.update-app-btn__icon {
  display: block;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.update-app-btn__label {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
}

.update-app-btn__badge {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
}

@media (max-width: 720px) {
  .update-app-btn__label {
    display: none;
  }

  .update-app-btn {
    width: 40px;
    min-width: 40px;
    padding: 0;
  }
}
</style>
